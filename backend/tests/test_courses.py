import hashlib
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app import app
from database.models import (
    Activity, ActivityVideo, Base, Course, Lesson, User, UserActivityProgress,
    UserCourseEnrollment, UserSession
)


class CoursesApiTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        engine_patch = patch("database.engine", self.engine)
        engine_patch.start()
        self.addCleanup(engine_patch.stop)
        self.addCleanup(self.engine.dispose)

        self.client = app.test_client()
        previous_secret = app.secret_key
        app.secret_key = "test-secret"
        self.addCleanup(setattr, app, "secret_key", previous_secret)

        # Seed sample user
        with Session(self.engine) as db:
            self.user = User(
                google_sub="test:user1",
                email="investor@example.com",
                name="Robert Biznesu",
            )
            db.add(self.user)
            db.commit()
            db.refresh(self.user)
            self.user_id = self.user.id

            # Create session token
            self.raw_token = "valid-test-token"
            token_hash = hashlib.sha256(self.raw_token.encode()).hexdigest()
            session = UserSession(
                token_hash=token_hash,
                user_id=self.user_id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
            db.add(session)

            # Seed Course, Lesson, Activities
            self.course = Course(
                slug="podstawy-gieldy",
                title="Podstawy Giełdy",
                description="Naucz się inwestować z Robertem Biznesu",
                category="investing",
                difficulty="beginner",
                estimated_minutes=20,
            )
            db.add(self.course)
            db.commit()
            db.refresh(self.course)

            self.lesson = Lesson(
                course_id=self.course.id,
                title="Lekcja 1: Akcje vs Obligacje",
                description="Podstawowe instrumenty finansowe",
                order_index=1,
                xp_reward=30,
            )
            db.add(self.lesson)
            db.commit()
            db.refresh(self.lesson)

            self.article_act = Activity(
                lesson_id=self.lesson.id,
                title="Czym jest akcja?",
                activity_type="article",
                order_index=1,
                xp_reward=10,
                coin_reward=5,
                content={
                    "markdown": "# Czym jest akcja?\nAkcja to papier wartościowy...",
                    "reading_time_minutes": 3,
                },
            )
            self.video_act = Activity(
                lesson_id=self.lesson.id,
                title="Wideo: Jak działa parkiet GPW?",
                activity_type="video",
                order_index=2,
                xp_reward=15,
                coin_reward=5,
                content={
                    "video_url": "https://example.com/video.mp4",
                    "duration_seconds": 180,
                },
            )
            self.quiz_act = Activity(
                lesson_id=self.lesson.id,
                title="Quiz sprawdzający",
                activity_type="quiz",
                order_index=3,
                xp_reward=25,
                coin_reward=10,
                content={
                    "passing_score_percentage": 50,
                    "questions": [
                        {
                            "id": "q1",
                            "prompt": "Co daje posiadanie akcji?",
                            "options": [
                                {"id": "a", "text": "Udział w kapitale spółki"},
                                {"id": "b", "text": "Gwarancję zysku"},
                            ],
                            "correct_option_id": "a",
                            "explanation": "Akcja daje udział własnościowy w spółce akcyjnej.",
                        },
                        {
                            "id": "q2",
                            "prompt": "Kto emituje obligacje skarbowe?",
                            "options": [
                                {"id": "a", "text": "Skarb Państwa"},
                                {"id": "b", "text": "Prywatna spółka zoo"},
                            ],
                            "correct_option_id": "a",
                            "explanation": "Obligacje skarbowe są emitowane przez Skarb Państwa.",
                        },
                    ],
                },
            )
            db.add_all([self.article_act, self.video_act, self.quiz_act])
            db.commit()

            self.course_id = self.course.id
            self.lesson_id = self.lesson.id
            self.article_id = self.article_act.id
            self.video_id = self.video_act.id
            self.quiz_id = self.quiz_act.id

    def set_auth_cookie(self):
        self.client.set_cookie("auth_session", self.raw_token)

    def test_get_courses_anonymous(self):
        res = self.client.get("/api/courses")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data["courses"]), 1)
        c = data["courses"][0]
        self.assertEqual(c["slug"], "podstawy-gieldy")
        self.assertEqual(c["total_activities"], 3)
        self.assertNotIn("user_progress", c)

    def test_get_courses_authenticated_with_progress(self):
        self.set_auth_cookie()
        res = self.client.get("/api/courses")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        c = data["courses"][0]
        self.assertIn("user_progress", c)
        self.assertFalse(c["user_progress"]["enrolled"])
        self.assertEqual(c["user_progress"]["completed_activities"], 0)

    def test_get_course_detail_by_id_and_slug(self):
        # By ID
        res = self.client.get(f"/api/courses/{self.course_id}")
        self.assertEqual(res.status_code, 200)
        c = res.get_json()["course"]
        self.assertEqual(c["id"], self.course_id)
        self.assertEqual(len(c["lessons"]), 1)
        self.assertEqual(len(c["lessons"][0]["activities"]), 3)

        # By Slug
        res_slug = self.client.get("/api/courses/podstawy-gieldy")
        self.assertEqual(res_slug.status_code, 200)
        self.assertEqual(res_slug.get_json()["course"]["id"], self.course_id)

    def test_course_enroll(self):
        # Unauthenticated: allowed for local storage tracking
        res = self.client.post(f"/api/courses/{self.course_id}/enroll")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.get_json()["persisted"])
        self.assertTrue(res.get_json()["enrolled"])

        # Authenticated: persisted to DB
        self.set_auth_cookie()
        res = self.client.post(f"/api/courses/{self.course_id}/enroll")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["persisted"])
        self.assertTrue(res.get_json()["enrolled"])

        # Check DB
        with Session(self.engine) as db:
            enrollment = db.scalar(
                select(UserCourseEnrollment).where(
                    UserCourseEnrollment.user_id == self.user_id,
                    UserCourseEnrollment.course_id == self.course_id,
                )
            )
            self.assertIsNotNone(enrollment)

    def test_lesson_detail(self):
        res = self.client.get(f"/api/lessons/{self.lesson_id}")
        self.assertEqual(res.status_code, 200)
        lesson_data = res.get_json()["lesson"]
        self.assertEqual(lesson_data["id"], self.lesson_id)
        self.assertEqual(len(lesson_data["activities"]), 3)

    def test_activity_detail_sanitizes_quiz_answers(self):
        res = self.client.get(f"/api/activities/{self.quiz_id}")
        self.assertEqual(res.status_code, 200)
        act = res.get_json()["activity"]
        self.assertEqual(act["activity_type"], "quiz")
        questions = act["content"]["questions"]
        self.assertEqual(len(questions), 2)
        # Verify correct_option_id and explanation are NOT exposed
        for q in questions:
            self.assertNotIn("correct_option_id", q)
            self.assertNotIn("explanation", q)
            self.assertIn("prompt", q)
            self.assertIn("options", q)

    def test_stored_video_is_versioned_cached_and_supports_ranges(self):
        with Session(self.engine) as db:
            db.add(ActivityVideo(
                activity_id=self.video_id,
                language="pl",
                filename="test.mp4",
                mime_type="video/mp4",
                size_bytes=16,
                data=b"\x00\x00\x00\x18ftypmp42test",
            ))
            db.commit()

        detail = self.client.get(f"/api/activities/{self.video_id}")
        video_url = detail.get_json()["activity"]["content"]["video_url"]
        self.assertIn("language=pl&v=", video_url)

        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Cache-Control"],
            "public, max-age=31536000, immutable",
        )
        self.assertIn("ETag", response.headers)

        cached = self.client.get(
            video_url, headers={"If-None-Match": response.headers["ETag"]}
        )
        self.assertEqual(cached.status_code, 304)

        partial = self.client.get(video_url, headers={"Range": "bytes=0-3"})
        self.assertEqual(partial.status_code, 206)
        self.assertEqual(partial.data, b"\x00\x00\x00\x18")

    def test_complete_article_and_video(self):
        self.set_auth_cookie()

        # Complete article
        res = self.client.post(f"/api/activities/{self.article_id}/complete")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["is_first_completion"])
        self.assertEqual(data["xp_earned"], 10)
        self.assertEqual(data["coins_earned"], 5)
        self.assertFalse(data["lesson_completed"])

        # Re-completing article should award 0 additional XP
        res_repeat = self.client.post(f"/api/activities/{self.article_id}/complete")
        self.assertEqual(res_repeat.status_code, 200)
        self.assertFalse(res_repeat.get_json()["is_first_completion"])
        self.assertEqual(res_repeat.get_json()["xp_earned"], 0)

        # Complete video
        res_v = self.client.post(f"/api/activities/{self.video_id}/complete")
        self.assertEqual(res_v.status_code, 200)
        self.assertEqual(res_v.get_json()["xp_earned"], 15)

    def test_complete_quiz_via_complete_endpoint_rejected(self):
        self.set_auth_cookie()
        res = self.client.post(f"/api/activities/{self.quiz_id}/complete")
        self.assertEqual(res.status_code, 400)

    def test_quiz_submit_fail_and_pass_flow(self):
        self.set_auth_cookie()

        # Enroll first
        self.client.post(f"/api/courses/{self.course_id}/enroll")

        # 1. Submit failing answers (0% score)
        res_fail = self.client.post(
            f"/api/activities/{self.quiz_id}/quiz-submit",
            json={"answers": {"q1": "b", "q2": "b"}},
        )
        self.assertEqual(res_fail.status_code, 200)
        data_fail = res_fail.get_json()
        self.assertFalse(data_fail["passed"])
        self.assertEqual(data_fail["score"], 0)
        self.assertEqual(data_fail["xp_earned"], 0)
        self.assertEqual(len(data_fail["review"]), 2)

        # 2. Complete article and video first
        self.client.post(f"/api/activities/{self.article_id}/complete")
        self.client.post(f"/api/activities/{self.video_id}/complete")

        # 3. Submit passing answers (100% score) -> Completes lesson and course!
        res_pass = self.client.post(
            f"/api/activities/{self.quiz_id}/quiz-submit",
            json={"answers": {"q1": "a", "q2": "a"}},
        )
        self.assertEqual(res_pass.status_code, 200)
        data_pass = res_pass.get_json()
        self.assertTrue(data_pass["passed"])
        self.assertEqual(data_pass["score"], 100)
        self.assertEqual(data_pass["xp_earned"], 25)
        self.assertEqual(data_pass["coins_earned"], 10)
        self.assertTrue(data_pass["is_first_completion"])
        self.assertTrue(data_pass["lesson_completed"])
        self.assertTrue(data_pass["course_completed"])

        # Check user progress endpoint
        res_prog = self.client.get("/api/user/progress")
        self.assertEqual(res_prog.status_code, 200)
        user_prog = res_prog.get_json()["progress"]
        self.assertEqual(user_prog["total_xp"], 10 + 15 + 25)
        self.assertEqual(user_prog["total_coins"], 3000 + 5 + 5 + 10)
        self.assertEqual(user_prog["completed_activities_count"], 3)
        self.assertEqual(len(user_prog["enrolled_courses"]), 1)
        self.assertEqual(user_prog["enrolled_courses"][0]["percentage"], 100)
        self.assertTrue(user_prog["enrolled_courses"][0]["is_completed"])

    def test_unauthenticated_actions_for_local_storage(self):
        # 1. Unauthenticated enroll
        res_enroll = self.client.post(f"/api/courses/{self.course_id}/enroll")
        self.assertEqual(res_enroll.status_code, 200)
        self.assertFalse(res_enroll.get_json()["persisted"])
        self.assertTrue(res_enroll.get_json()["enrolled"])

        # 2. Unauthenticated article complete
        res_complete = self.client.post(f"/api/activities/{self.article_id}/complete")
        self.assertEqual(res_complete.status_code, 200)
        self.assertFalse(res_complete.get_json()["persisted"])
        self.assertEqual(res_complete.get_json()["xp_earned"], 10)
        self.assertEqual(res_complete.get_json()["coins_earned"], 5)

        # 3. Unauthenticated quiz submit
        res_quiz = self.client.post(
            f"/api/activities/{self.quiz_id}/quiz-submit",
            json={"answers": {"q1": "a", "q2": "a"}},
        )
        self.assertEqual(res_quiz.status_code, 200)
        quiz_data = res_quiz.get_json()
        self.assertFalse(quiz_data["persisted"])
        self.assertTrue(quiz_data["passed"])
        self.assertEqual(quiz_data["score"], 100)
        self.assertEqual(quiz_data["xp_earned"], 25)
        self.assertEqual(quiz_data["coins_earned"], 10)

        # Ensure nothing was persisted to DB
        with Session(self.engine) as db:
            self.assertEqual(len(db.scalars(select(UserActivityProgress)).all()), 0)
            self.assertEqual(len(db.scalars(select(UserCourseEnrollment)).all()), 0)

    def test_sync_local_storage_progress_to_db(self):
        # User has accumulated progress in localStorage and now logs in
        self.set_auth_cookie()

        sync_payload = {
            "enrolled_course_ids": [self.course_id],
            "activities": [
                {
                    "activity_id": self.article_id,
                    "status": "completed",
                    "passed": True,
                    "quiz_score": None,
                },
                {
                    "activity_id": self.video_id,
                    "status": "completed",
                    "passed": True,
                    "quiz_score": None,
                },
                {
                    "activity_id": self.quiz_id,
                    "status": "completed",
                    "passed": True,
                    "quiz_score": 100,
                },
            ],
        }

        res_sync = self.client.post("/api/user/progress/sync", json=sync_payload)
        self.assertEqual(res_sync.status_code, 200)
        sync_result = res_sync.get_json()
        self.assertEqual(sync_result["synced_enrollments"], 1)
        self.assertEqual(sync_result["synced_activities"], 3)
        self.assertEqual(sync_result["total_new_xp"], 10 + 15 + 25)
        self.assertEqual(sync_result["total_new_coins"], 5 + 5 + 10)

        # Verify DB records
        with Session(self.engine) as db:
            enrollment = db.scalar(
                select(UserCourseEnrollment).where(
                    UserCourseEnrollment.user_id == self.user_id,
                    UserCourseEnrollment.course_id == self.course_id,
                )
            )
            self.assertIsNotNone(enrollment)
            self.assertIsNotNone(enrollment.completed_at)

            progress_records = db.scalars(
                select(UserActivityProgress).where(UserActivityProgress.user_id == self.user_id)
            ).all()
            self.assertEqual(len(progress_records), 3)

        # Verify user progress endpoint
        res_prog = self.client.get("/api/user/progress")
        self.assertEqual(res_prog.status_code, 200)
        user_prog = res_prog.get_json()["progress"]
        self.assertEqual(user_prog["total_xp"], 50)
        self.assertEqual(user_prog["completed_activities_count"], 3)
        self.assertTrue(user_prog["enrolled_courses"][0]["is_completed"])


if __name__ == "__main__":
    unittest.main()
