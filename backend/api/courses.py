import hmac
from datetime import datetime, timezone
from io import BytesIO

from flask import Blueprint, current_app, jsonify, request, send_file
from flask.views import MethodView
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.utils import secure_filename

from api.auth import get_authenticated_user
from database import database
from database.models import (
    Activity, ActivityVideo, Course, Lesson, SUPPORTED_LANGUAGE_CODES,
    UserActivityProgress, UserCourseEnrollment,
)

courses = Blueprint("courses", __name__)


def request_content_language() -> str:
    for language, quality in request.accept_languages:
        if quality <= 0:
            continue
        language_code = language.lower().split("-", 1)[0]
        if language_code in SUPPORTED_LANGUAGE_CODES:
            return language_code
    return "pl"


def get_stored_video(
    db, activity_id: int, language: str, fallback_to_polish: bool = True
) -> ActivityVideo | None:
    video = db.scalar(
        select(ActivityVideo).where(
            ActivityVideo.activity_id == activity_id,
            ActivityVideo.language == language,
        )
    )
    if video or language == "pl" or not fallback_to_polish:
        return video
    return db.scalar(
        select(ActivityVideo).where(
            ActivityVideo.activity_id == activity_id,
            ActivityVideo.language == "pl",
        )
    )


def add_stored_video_details(video: ActivityVideo | None, activity_data: dict) -> None:
    """Expose a local playback URL without serializing the MP4 into JSON."""
    if not video:
        return

    content = activity_data.setdefault("content", {})
    content.update({
        "video_url": f"/api/activities/{video.activity_id}/video?language={video.language}",
        "video_filename": video.filename,
        "video_mime_type": video.mime_type,
        "video_size_bytes": video.size_bytes,
        "video_language": video.language,
    })


def is_content_admin() -> bool:
    configured_token = current_app.config.get("CONTENT_ADMIN_TOKEN")
    provided_token = request.headers.get("X-Content-Admin-Token")
    return bool(
        configured_token
        and provided_token
        and hmac.compare_digest(provided_token, configured_token)
    )


def is_mp4(video_data: bytes) -> bool:
    """Check the ISO base media file signature used by MP4 containers."""
    return len(video_data) >= 12 and video_data[4:8] == b"ftyp"


def check_lesson_completed(db, lesson_id: int, user_id: int) -> bool:
    act_ids = db.scalars(
        select(Activity.id).where(Activity.lesson_id == lesson_id)
    ).all()
    if not act_ids:
        return False
    completed_count = db.scalar(
        select(func.count(UserActivityProgress.id))
        .where(
            UserActivityProgress.user_id == user_id,
            UserActivityProgress.activity_id.in_(act_ids),
            UserActivityProgress.status == "completed",
        )
    )
    return completed_count == len(act_ids)


def check_course_completed(db, course_id: int, user_id: int) -> bool:
    act_ids = db.scalars(
        select(Activity.id)
        .join(Lesson, Lesson.id == Activity.lesson_id)
        .where(Lesson.course_id == course_id, Lesson.is_published.is_(True))
    ).all()
    if not act_ids:
        return False
    completed_count = db.scalar(
        select(func.count(UserActivityProgress.id))
        .where(
            UserActivityProgress.user_id == user_id,
            UserActivityProgress.activity_id.in_(act_ids),
            UserActivityProgress.status == "completed",
        )
    )
    return completed_count == len(act_ids)


class CourseListView(MethodView):
    def get(self):
        category = request.args.get("category")
        language = request_content_language()
        try:
            with database() as db:
                user = get_authenticated_user(db)
                stmt = select(Course).where(Course.is_published.is_(True))
                if category:
                    stmt = stmt.where(Course.category == category)
                stmt = stmt.order_by(Course.id)
                course_list = db.scalars(stmt).all()

                courses_data = []
                for course in course_list:
                    c_dict = course.to_dict(language=language)
                    # Calculate total activities in course
                    total_activities = db.scalar(
                        select(func.count(Activity.id))
                        .join(Lesson, Lesson.id == Activity.lesson_id)
                        .where(Lesson.course_id == course.id, Lesson.is_published.is_(True))
                    ) or 0
                    c_dict["total_activities"] = total_activities
                    c_dict["lessons_count"] = len(course.lessons)

                    if user:
                        enrollment = db.scalar(
                            select(UserCourseEnrollment).where(
                                UserCourseEnrollment.user_id == user.id,
                                UserCourseEnrollment.course_id == course.id,
                            )
                        )
                        completed_activities = db.scalar(
                            select(func.count(UserActivityProgress.id))
                            .join(Activity, Activity.id == UserActivityProgress.activity_id)
                            .join(Lesson, Lesson.id == Activity.lesson_id)
                            .where(
                                Lesson.course_id == course.id,
                                UserActivityProgress.user_id == user.id,
                                UserActivityProgress.status == "completed",
                            )
                        ) or 0
                        percentage = (
                            int(round((completed_activities / total_activities) * 100))
                            if total_activities > 0 else 0
                        )
                        c_dict["user_progress"] = {
                            "enrolled": enrollment is not None,
                            "completed_activities": completed_activities,
                            "total_activities": total_activities,
                            "percentage": percentage,
                            "is_completed": bool(enrollment and enrollment.completed_at),
                        }
                    courses_data.append(c_dict)

                return jsonify(courses=courses_data)
        except SQLAlchemyError:
            current_app.logger.exception("Could not list courses")
            return jsonify(error="Database unavailable"), 503


class CourseDetailView(MethodView):
    def get(self, identifier):
        language = request_content_language()
        try:
            with database() as db:
                user = get_authenticated_user(db)
                if identifier.isdigit():
                    stmt = select(Course).where(Course.id == int(identifier))
                else:
                    stmt = select(Course).where(Course.slug == identifier)

                stmt = stmt.where(Course.is_published.is_(True))
                course = db.scalar(stmt)
                if not course:
                    return jsonify(error="Course not found"), 404

                course_data = course.to_dict(language=language)
                enrollment = None
                if user:
                    enrollment = db.scalar(
                        select(UserCourseEnrollment).where(
                            UserCourseEnrollment.user_id == user.id,
                            UserCourseEnrollment.course_id == course.id,
                        )
                    )

                # Fetch published lessons and their activities
                lessons_stmt = (
                    select(Lesson)
                    .where(Lesson.course_id == course.id, Lesson.is_published.is_(True))
                    .order_by(Lesson.order_index)
                )
                lessons = db.scalars(lessons_stmt).all()

                completed_activity_ids = set()
                if user:
                    user_completed = db.scalars(
                        select(UserActivityProgress.activity_id)
                        .join(Activity, Activity.id == UserActivityProgress.activity_id)
                        .join(Lesson, Lesson.id == Activity.lesson_id)
                        .where(
                            Lesson.course_id == course.id,
                            UserActivityProgress.user_id == user.id,
                            UserActivityProgress.status == "completed",
                        )
                    ).all()
                    completed_activity_ids = set(user_completed)

                lessons_data = []
                total_activities = 0
                completed_activities = 0

                for lesson in lessons:
                    l_dict = lesson.to_dict(language=language)
                    acts_data = []
                    for act in lesson.activities:
                        total_activities += 1
                        act_dict = act.to_dict(include_content=False, language=language)
                        is_comp = act.id in completed_activity_ids
                        if is_comp:
                            completed_activities += 1
                        act_dict["is_completed"] = is_comp
                        acts_data.append(act_dict)
                    l_dict["activities"] = acts_data
                    l_dict["is_completed"] = (
                        len(acts_data) > 0 and all(a["is_completed"] for a in acts_data)
                    ) if user else False
                    lessons_data.append(l_dict)

                course_data["lessons"] = lessons_data
                course_data["total_activities"] = total_activities
                if user:
                    percentage = (
                        int(round((completed_activities / total_activities) * 100))
                        if total_activities > 0 else 0
                    )
                    course_data["user_progress"] = {
                        "enrolled": enrollment is not None,
                        "completed_activities": completed_activities,
                        "total_activities": total_activities,
                        "percentage": percentage,
                        "is_completed": bool(enrollment and enrollment.completed_at),
                    }

                return jsonify(course=course_data)
        except SQLAlchemyError:
            current_app.logger.exception("Could not get course detail")
            return jsonify(error="Database unavailable"), 503


class CourseEnrollView(MethodView):
    def post(self, course_id: int):
        try:
            with database() as db:
                user = get_authenticated_user(db)
                course = db.scalar(
                    select(Course).where(Course.id == course_id, Course.is_published.is_(True))
                )
                if not course:
                    return jsonify(error="Course not found"), 404

                if not user:
                    # Unauthenticated user: progress is managed in local storage
                    return jsonify(status="ok", enrolled=True, course_id=course_id, persisted=False)

                enrollment = db.scalar(
                    select(UserCourseEnrollment).where(
                        UserCourseEnrollment.user_id == user.id,
                        UserCourseEnrollment.course_id == course.id,
                    )
                )
                now = datetime.now(timezone.utc)
                if not enrollment:
                    enrollment = UserCourseEnrollment(
                        user_id=user.id,
                        course_id=course.id,
                        enrolled_at=now,
                        last_accessed_at=now,
                    )
                    db.add(enrollment)
                else:
                    enrollment.last_accessed_at = now
                db.commit()

            return jsonify(status="ok", enrolled=True, course_id=course_id, persisted=True)
        except SQLAlchemyError:
            current_app.logger.exception("Could not enroll in course")
            return jsonify(error="Database unavailable"), 503


class LessonDetailView(MethodView):
    def get(self, lesson_id: int):
        language = request_content_language()
        try:
            with database() as db:
                user = get_authenticated_user(db)
                lesson = db.scalar(
                    select(Lesson).where(Lesson.id == lesson_id, Lesson.is_published.is_(True))
                )
                if not lesson:
                    return jsonify(error="Lesson not found"), 404

                completed_ids = set()
                if user:
                    completed_ids = set(
                        db.scalars(
                            select(UserActivityProgress.activity_id).where(
                                UserActivityProgress.user_id == user.id,
                                UserActivityProgress.status == "completed",
                            )
                        ).all()
                    )

                lesson_data = lesson.to_dict(language=language)
                activities_data = []
                for act in lesson.activities:
                    act_dict = act.to_dict(include_content=False, language=language)
                    act_dict["is_completed"] = act.id in completed_ids
                    activities_data.append(act_dict)

                lesson_data["activities"] = activities_data
                lesson_data["is_completed"] = (
                    len(activities_data) > 0 and all(a["is_completed"] for a in activities_data)
                ) if user else False
                return jsonify(lesson=lesson_data)
        except SQLAlchemyError:
            current_app.logger.exception("Could not get lesson detail")
            return jsonify(error="Database unavailable"), 503


class ActivityDetailView(MethodView):
    def get(self, activity_id: int):
        language = request_content_language()
        try:
            with database() as db:
                user = get_authenticated_user(db)
                activity = db.scalar(select(Activity).where(Activity.id == activity_id))
                if not activity:
                    return jsonify(error="Activity not found"), 404

                act_data = activity.to_dict(
                    include_content=True, sanitize_quiz=True, language=language
                )
                if activity.activity_type == "video":
                    add_stored_video_details(
                        get_stored_video(db, activity.id, language), act_data
                    )
                if user:
                    progress = db.scalar(
                        select(UserActivityProgress).where(
                            UserActivityProgress.user_id == user.id,
                            UserActivityProgress.activity_id == activity.id,
                        )
                    )
                    if progress:
                        act_data["user_progress"] = {
                            "status": progress.status,
                            "quiz_score": progress.quiz_score,
                            "passed": progress.passed,
                            "attempts_count": progress.attempts_count,
                            "xp_earned": progress.xp_earned,
                            "coins_earned": progress.coins_earned,
                            "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
                        }
                    else:
                        act_data["user_progress"] = None

                return jsonify(activity=act_data)
        except SQLAlchemyError:
            current_app.logger.exception("Could not get activity detail")
            return jsonify(error="Database unavailable"), 503


class ActivityVideoView(MethodView):
    def get(self, activity_id: int):
        try:
            with database() as db:
                activity = db.scalar(select(Activity).where(Activity.id == activity_id))
                if (
                    not activity
                    or activity.activity_type != "video"
                ):
                    return jsonify(error="Video not found"), 404

                language = request.args.get("language") or request_content_language()
                if language not in SUPPORTED_LANGUAGE_CODES:
                    return jsonify(error="Unsupported language. Use one of: pl, en, de"), 400
                video = get_stored_video(db, activity.id, language)
                if not video:
                    return jsonify(error="Video not found"), 404
                video_data = video.data

                return send_file(
                    BytesIO(video_data),
                    mimetype="video/mp4",
                    as_attachment=False,
                    download_name=video.filename,
                    conditional=True,
                )
        except SQLAlchemyError:
            current_app.logger.exception("Could not load activity video")
            return jsonify(error="Database unavailable"), 503

    def post(self, activity_id: int):
        if not current_app.config.get("CONTENT_ADMIN_TOKEN"):
            return jsonify(error="Video upload is not configured"), 503
        if not is_content_admin():
            return jsonify(error="Forbidden"), 403

        max_size = current_app.config["MAX_VIDEO_UPLOAD_BYTES"]
        if request.content_length and request.content_length > max_size:
            return jsonify(error="Video file is too large"), 413

        uploaded_file = request.files.get("video")
        if not uploaded_file or not uploaded_file.filename:
            return jsonify(error="Missing multipart field: video"), 400

        language = request.form.get("language", "pl").lower()
        if language not in SUPPORTED_LANGUAGE_CODES:
            return jsonify(error="Unsupported language. Use one of: pl, en, de"), 400

        filename = secure_filename(uploaded_file.filename)
        if not filename.lower().endswith(".mp4"):
            return jsonify(error="Video file must have an .mp4 extension"), 400

        video_data = uploaded_file.read(max_size + 1)
        if len(video_data) > max_size:
            return jsonify(error="Video file is too large"), 413
        if not is_mp4(video_data):
            return jsonify(error="Uploaded file is not a valid MP4 container"), 400

        try:
            with database() as db:
                activity = db.scalar(select(Activity).where(Activity.id == activity_id))
                if not activity:
                    return jsonify(error="Activity not found"), 404
                if activity.activity_type != "video":
                    return jsonify(error="Activity is not a video"), 400

                video = get_stored_video(
                    db, activity.id, language, fallback_to_polish=False
                )
                is_new_video = video is None
                if not video:
                    video = ActivityVideo(activity_id=activity.id, language=language)
                    db.add(video)
                video.filename = filename
                video.mime_type = "video/mp4"
                video.size_bytes = len(video_data)
                video.data = video_data
                db.commit()

                return jsonify(
                    status="ok",
                    activity_id=activity.id,
                    video={
                        "url": f"/api/activities/{activity.id}/video?language={video.language}",
                        "language": video.language,
                        "filename": video.filename,
                        "mime_type": video.mime_type,
                        "size_bytes": video.size_bytes,
                    },
                ), 201 if is_new_video else 200
        except SQLAlchemyError:
            current_app.logger.exception("Could not store activity video")
            return jsonify(error="Database unavailable"), 503


class ActivityCompleteView(MethodView):
    def post(self, activity_id: int):
        try:
            with database() as db:
                user = get_authenticated_user(db)
                activity = db.scalar(select(Activity).where(Activity.id == activity_id))
                if not activity:
                    return jsonify(error="Activity not found"), 404

                if activity.activity_type == "quiz":
                    return jsonify(
                        error="Quizzes must be submitted via /api/activities/<id>/quiz-submit"
                    ), 400

                if not user:
                    # Unauthenticated user: progress is kept in local storage
                    return jsonify(
                        status="ok",
                        activity_id=activity_id,
                        xp_earned=activity.xp_reward,
                        coins_earned=activity.coin_reward,
                        is_first_completion=True,
                        lesson_completed=False,
                        course_completed=False,
                        persisted=False,
                    )

                progress = db.scalar(
                    select(UserActivityProgress).where(
                        UserActivityProgress.user_id == user.id,
                        UserActivityProgress.activity_id == activity.id,
                    )
                )

                now = datetime.now(timezone.utc)
                is_first_completion = False
                xp_earned = 0
                coins_earned = 0

                if not progress:
                    is_first_completion = True
                    xp_earned = activity.xp_reward
                    coins_earned = activity.coin_reward
                    progress = UserActivityProgress(
                        user_id=user.id,
                        activity_id=activity.id,
                        status="completed",
                        passed=True,
                        attempts_count=1,
                        xp_earned=xp_earned,
                        coins_earned=coins_earned,
                        completed_at=now,
                    )
                    db.add(progress)
                elif progress.status != "completed":
                    is_first_completion = True
                    xp_earned = activity.xp_reward
                    coins_earned = activity.coin_reward
                    progress.status = "completed"
                    progress.passed = True
                    progress.xp_earned = xp_earned
                    progress.coins_earned = coins_earned
                    progress.completed_at = now

                user.shark_coins += coins_earned
                db.flush()

                # Check lesson and course completion
                lesson = db.scalar(select(Lesson).where(Lesson.id == activity.lesson_id))
                lesson_completed = check_lesson_completed(db, lesson.id, user.id)
                course_completed = check_course_completed(db, lesson.course_id, user.id)

                if course_completed:
                    enrollment = db.scalar(
                        select(UserCourseEnrollment).where(
                            UserCourseEnrollment.user_id == user.id,
                            UserCourseEnrollment.course_id == lesson.course_id,
                        )
                    )
                    if enrollment and not enrollment.completed_at:
                        enrollment.completed_at = now

                db.commit()

            return jsonify(
                status="ok",
                activity_id=activity_id,
                xp_earned=xp_earned,
                coins_earned=coins_earned,
                is_first_completion=is_first_completion,
                lesson_completed=lesson_completed,
                course_completed=course_completed,
                persisted=True,
            )
        except SQLAlchemyError:
            current_app.logger.exception("Could not complete activity")
            return jsonify(error="Database unavailable"), 503


class QuizSubmitView(MethodView):
    def post(self, activity_id: int):
        language = request_content_language()
        try:
            with database() as db:
                user = get_authenticated_user(db)
                activity = db.scalar(select(Activity).where(Activity.id == activity_id))
                if not activity:
                    return jsonify(error="Activity not found"), 404
                if activity.activity_type != "quiz":
                    return jsonify(error="Activity is not a quiz"), 400

                payload = request.get_json(silent=True) or {}
                user_answers = payload.get("answers", {})

                content = activity.content or {}
                questions = content.get("questions", [])
                translated_content = activity.localized_content(language) or {}
                translated_questions = {
                    str(question.get("id")): question
                    for question in translated_content.get("questions", [])
                }
                total_questions = len(questions)

                review = []
                correct_count = 0
                for q in questions:
                    q_id = str(q.get("id"))
                    correct_opt = str(q.get("correct_option_id", ""))
                    submitted_opt = str(user_answers.get(q_id, "")) if q_id in user_answers else None
                    translated_question = translated_questions.get(q_id, {})

                    is_correct = (submitted_opt is not None and submitted_opt == correct_opt)
                    if is_correct:
                        correct_count += 1

                    review.append({
                        "question_id": q_id,
                        "prompt": translated_question.get("prompt", q.get("prompt")),
                        "submitted_option": submitted_opt,
                        "correct_option": correct_opt,
                        "is_correct": is_correct,
                        "explanation": translated_question.get("explanation", q.get("explanation")),
                    })

                score_percent = (
                    int(round((correct_count / total_questions) * 100))
                    if total_questions > 0 else 0
                )
                passing_score = content.get("passing_score_percentage", 70)
                passed = score_percent >= passing_score

                if not user:
                    # Unauthenticated user: evaluate quiz and return results for local storage
                    return jsonify(
                        status="ok",
                        passed=passed,
                        score=score_percent,
                        passing_score=passing_score,
                        correct_count=correct_count,
                        total_questions=total_questions,
                        xp_earned=activity.xp_reward if passed else 0,
                        coins_earned=activity.coin_reward if passed else 0,
                        is_first_completion=True,
                        lesson_completed=False,
                        course_completed=False,
                        persisted=False,
                        review=review,
                    )

                now = datetime.now(timezone.utc)
                progress = db.scalar(
                    select(UserActivityProgress).where(
                        UserActivityProgress.user_id == user.id,
                        UserActivityProgress.activity_id == activity.id,
                    )
                )

                is_first_completion = False
                xp_earned = 0
                coins_earned = 0

                if not progress:
                    if passed:
                        is_first_completion = True
                        xp_earned = activity.xp_reward
                        coins_earned = activity.coin_reward
                    progress = UserActivityProgress(
                        user_id=user.id,
                        activity_id=activity.id,
                        status="completed" if passed else "started",
                        quiz_score=score_percent,
                        passed=passed,
                        attempts_count=1,
                        submitted_data=user_answers,
                        xp_earned=xp_earned,
                        coins_earned=coins_earned,
                        completed_at=now if passed else None,
                    )
                    db.add(progress)
                else:
                    progress.attempts_count += 1
                    progress.submitted_data = user_answers
                    if score_percent > (progress.quiz_score or 0):
                        progress.quiz_score = score_percent

                    if passed and not progress.passed:
                        is_first_completion = True
                        xp_earned = activity.xp_reward
                        coins_earned = activity.coin_reward
                        progress.status = "completed"
                        progress.passed = True
                        progress.xp_earned = xp_earned
                        progress.coins_earned = coins_earned
                        progress.completed_at = now

                user.shark_coins += coins_earned
                db.flush()

                lesson = db.scalar(select(Lesson).where(Lesson.id == activity.lesson_id))
                lesson_completed = check_lesson_completed(db, lesson.id, user.id)
                course_completed = check_course_completed(db, lesson.course_id, user.id)

                if course_completed:
                    enrollment = db.scalar(
                        select(UserCourseEnrollment).where(
                            UserCourseEnrollment.user_id == user.id,
                            UserCourseEnrollment.course_id == lesson.course_id,
                        )
                    )
                    if enrollment and not enrollment.completed_at:
                        enrollment.completed_at = now

                db.commit()

            return jsonify(
                status="ok",
                passed=passed,
                score=score_percent,
                passing_score=passing_score,
                correct_count=correct_count,
                total_questions=total_questions,
                xp_earned=xp_earned,
                coins_earned=coins_earned,
                is_first_completion=is_first_completion,
                lesson_completed=lesson_completed,
                course_completed=course_completed,
                persisted=True,
                review=review,
            )
        except SQLAlchemyError:
            current_app.logger.exception("Could not submit quiz")
            return jsonify(error="Database unavailable"), 503


class UserProgressView(MethodView):
    def get(self):
        language = request_content_language()
        try:
            with database() as db:
                user = get_authenticated_user(db)
                if not user:
                    return jsonify(error="Not authenticated"), 401

                total_xp = db.scalar(
                    select(func.coalesce(func.sum(UserActivityProgress.xp_earned), 0))
                    .where(UserActivityProgress.user_id == user.id)
                ) or 0
                completed_activities_count = db.scalar(
                    select(func.count(UserActivityProgress.id))
                    .where(
                        UserActivityProgress.user_id == user.id,
                        UserActivityProgress.status == "completed",
                    )
                ) or 0

                # Enrolled courses
                enrollments = db.scalars(
                    select(UserCourseEnrollment).where(UserCourseEnrollment.user_id == user.id)
                ).all()

                courses_progress = []
                for enroll in enrollments:
                    course = db.scalar(select(Course).where(Course.id == enroll.course_id))
                    if not course:
                        continue
                    total_acts = db.scalar(
                        select(func.count(Activity.id))
                        .join(Lesson, Lesson.id == Activity.lesson_id)
                        .where(Lesson.course_id == course.id, Lesson.is_published.is_(True))
                    ) or 0
                    comp_acts = db.scalar(
                        select(func.count(UserActivityProgress.id))
                        .join(Activity, Activity.id == UserActivityProgress.activity_id)
                        .join(Lesson, Lesson.id == Activity.lesson_id)
                        .where(
                            Lesson.course_id == course.id,
                            UserActivityProgress.user_id == user.id,
                            UserActivityProgress.status == "completed",
                        )
                    ) or 0
                    pct = int(round((comp_acts / total_acts) * 100)) if total_acts > 0 else 0
                    courses_progress.append({
                        "course_id": course.id,
                        "title": course.to_dict(language=language)["title"],
                        "slug": course.slug,
                        "category": course.category,
                        "difficulty": course.difficulty,
                        "completed_activities": comp_acts,
                        "total_activities": total_acts,
                        "percentage": pct,
                        "is_completed": bool(enroll.completed_at),
                        "enrolled_at": enroll.enrolled_at.isoformat() if enroll.enrolled_at else None,
                    })

                return jsonify(
                    progress={
                        "total_xp": int(total_xp),
                        "total_coins": int(user.shark_coins),
                        "shark_coins": int(user.shark_coins),
                        "completed_activities_count": int(completed_activities_count),
                        "enrolled_courses": courses_progress,
                    }
                )
        except SQLAlchemyError:
            current_app.logger.exception("Could not get user progress")
            return jsonify(error="Database unavailable"), 503


class UserProgressSyncView(MethodView):
    def post(self):
        try:
            with database() as db, db.begin():
                user = get_authenticated_user(db)
                if not user:
                    return jsonify(error="Not authenticated"), 401

                payload = request.get_json(silent=True) or {}
                enrolled_ids = payload.get("enrolled_course_ids", [])
                activities_data = payload.get("activities", [])

                now = datetime.now(timezone.utc)
                synced_enrollments = 0
                synced_activities = 0
                total_new_xp = 0
                total_new_coins = 0

                # 1. Sync course enrollments from local storage
                for c_id in enrolled_ids:
                    course = db.scalar(select(Course).where(Course.id == c_id))
                    if not course:
                        continue
                    enrollment = db.scalar(
                        select(UserCourseEnrollment).where(
                            UserCourseEnrollment.user_id == user.id,
                            UserCourseEnrollment.course_id == c_id,
                        )
                    )
                    if not enrollment:
                        enrollment = UserCourseEnrollment(
                            user_id=user.id,
                            course_id=c_id,
                            enrolled_at=now,
                            last_accessed_at=now,
                        )
                        db.add(enrollment)
                        synced_enrollments += 1

                # 2. Sync completed activities from local storage
                affected_course_ids = set()
                for item in activities_data:
                    act_id = item.get("activity_id")
                    activity = db.scalar(select(Activity).where(Activity.id == act_id))
                    if not activity:
                        continue

                    lesson = db.scalar(select(Lesson).where(Lesson.id == activity.lesson_id))
                    if lesson:
                        affected_course_ids.add(lesson.course_id)

                    status = item.get("status", "completed")
                    passed = bool(item.get("passed", True))
                    quiz_score = item.get("quiz_score")

                    progress = db.scalar(
                        select(UserActivityProgress).where(
                            UserActivityProgress.user_id == user.id,
                            UserActivityProgress.activity_id == act_id,
                        )
                    )

                    if not progress:
                        xp = activity.xp_reward if (status == "completed" and passed) else 0
                        coins = activity.coin_reward if (status == "completed" and passed) else 0
                        progress = UserActivityProgress(
                            user_id=user.id,
                            activity_id=act_id,
                            status=status,
                            passed=passed,
                            quiz_score=quiz_score,
                            attempts_count=1,
                            xp_earned=xp,
                            coins_earned=coins,
                            completed_at=now if status == "completed" else None,
                        )
                        db.add(progress)
                        synced_activities += 1
                        total_new_xp += xp
                        total_new_coins += coins
                    elif progress.status != "completed" and status == "completed" and passed:
                        progress.status = "completed"
                        progress.passed = True
                        if quiz_score is not None and quiz_score > (progress.quiz_score or 0):
                            progress.quiz_score = quiz_score
                        progress.xp_earned = activity.xp_reward
                        progress.coins_earned = activity.coin_reward
                        progress.completed_at = now
                        synced_activities += 1
                        total_new_xp += activity.xp_reward
                        total_new_coins += activity.coin_reward

                # 3. Check course completions for affected courses
                for course_id in affected_course_ids:
                    if check_course_completed(db, course_id, user.id):
                        enrollment = db.scalar(
                            select(UserCourseEnrollment).where(
                                UserCourseEnrollment.user_id == user.id,
                                UserCourseEnrollment.course_id == course_id,
                            )
                        )
                        if enrollment and not enrollment.completed_at:
                            enrollment.completed_at = now

                user.shark_coins += total_new_coins

            return jsonify(
                status="ok",
                synced_enrollments=synced_enrollments,
                synced_activities=synced_activities,
                total_new_xp=total_new_xp,
                total_new_coins=total_new_coins,
            )
        except SQLAlchemyError:
            current_app.logger.exception("Could not sync progress")
            return jsonify(error="Database unavailable"), 503


courses.add_url_rule("/api/courses", view_func=CourseListView.as_view("course_list"))
courses.add_url_rule("/api/courses/<identifier>", view_func=CourseDetailView.as_view("course_detail"))
courses.add_url_rule("/api/courses/<int:course_id>/enroll", view_func=CourseEnrollView.as_view("course_enroll"))
courses.add_url_rule("/api/lessons/<int:lesson_id>", view_func=LessonDetailView.as_view("lesson_detail"))
courses.add_url_rule("/api/activities/<int:activity_id>", view_func=ActivityDetailView.as_view("activity_detail"))
courses.add_url_rule("/api/activities/<int:activity_id>/video", view_func=ActivityVideoView.as_view("activity_video"))
courses.add_url_rule("/api/activities/<int:activity_id>/complete", view_func=ActivityCompleteView.as_view("activity_complete"))
courses.add_url_rule("/api/activities/<int:activity_id>/quiz-submit", view_func=QuizSubmitView.as_view("quiz_submit"))
courses.add_url_rule("/api/user/progress", view_func=UserProgressView.as_view("user_progress"))
courses.add_url_rule("/api/user/progress/sync", view_func=UserProgressSyncView.as_view("user_progress_sync"))
