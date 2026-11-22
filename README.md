# Collabothon 2026 — Project Card
## Team

**Rekiny Roberta**

## Project Name

**FinanceShark**

## Live link
**https://shark-finance-web-141627841887.us-east1.run.app**

## One-Line Summary

FinanceShark is a gamified financial-learning app that helps beginners build confidence through courses, market simulations and an AI finance mentor.

## Technology Stack

- **Frontend:** Next.js 16 (app router), React 19, TypeScript, Tailwind CSS, TanStack Query, Radix UI and next-intl.
- **Backend:** Python, Flask, SQLAlchemy and PostgreSQL.
- **AI:** Google Gemini for chat, retrieval embeddings and text-to-speech; a local fallback keeps the demo usable without an API key.
- **Cloud and delivery:** Google Cloud SQL, Cloud Run, Cloud Build, Docker Compose and the Cloud SQL Auth Proxy.
- **Identity and integrations:** Google OAuth via Authlib, multilingual content in Polish, English and German, and HTTP video streaming with browser/CDN caching.

## Project Overview

### The Problem

Personal finance and investing can feel inaccessible to people who are just starting out. Educational material is often fragmented, overly technical or disconnected from the decisions a learner makes every day: how to budget, build an emergency fund, understand inflation, or assess investment risk. Beginners need a safe way to learn by doing before acting on real financial products.

### Your Solution

FinanceShark turns financial education into a guided, gamified journey led by Robert Biznesu, the project's shark mentor. It combines short learning paths, quizzes, video content, historical market simulations and a finance-focused AI chat assistant in one mobile-first experience. Progress, XP and SharkCoins make learning visible and rewarding, while the assistant connects a learner's questions to relevant, curated material rather than presenting generic investment tips.

### The Working Prototype

The prototype is usable today and includes:

- Google OAuth authentication and a no-credential mock-login mode for demonstrations, with user roles, preferences and session handling.
- Four roadmap categories — stocks and bonds, investing, budgeting and economics — with lessons made of articles, quizzes and video activities. Completion state is tracked per user, and each category shows live completed-lesson progress.
- Polish, English and German interfaces and learning content. Video activities can store an MP4 per language, stream it with range requests, and safely cache versioned URLs.
- Historical, quarter-by-quarter investment simulations in which users choose allocations, review market events and receive a debrief with portfolio results. User can run scenario many times and test different strategies.
- Robert Biznesu chat: retrieval-augmented answers based on curated finance knowledge and course material, lesson recommendations, optional voice output and a safe demo fallback when Gemini is unavailable.
- A leaderboard, XP and SharkCoin rewards, profile and avatar customisation, accessibility controls, onboarding quiz, mini-game and shop interface.

### Behind the Build

The frontend is a Next.js application with client-side data fetching and a responsive component system. The Flask API exposes separate modules for authentication, learning, simulations, chat and ranking. PostgreSQL stores accounts, courses, activities, multilingual content, progress, rewards and simulation state; course videos are stored separately as MP4 data and are never embedded in normal JSON responses.

The chat service combines Google Gemini with a curated retrieval layer. It uses semantic embeddings together with lexical matching, then returns sources and lesson suggestions alongside the answer. The simulation engine runs deterministic historical scenarios quarter by quarter, so users can explore allocation choices without connecting to a brokerage account. Deployment configuration separates the frontend and API into Cloud Run services, with Cloud SQL credentials and OAuth secrets supplied at runtime rather than committed to the repository.

### Challenges and Discoveries

The main challenge was connecting an engaging product experience with trustworthy financial education. We addressed this by keeping the AI assistant in a finance-focused domain, grounding it in a curated knowledge base, showing sources, and framing the product as educational rather than as investment advice.

We also had to make progress work consistently for guests and signed-in users, support three languages without duplicating the application flow, and deliver video content efficiently. This led to local guest-progress fallbacks, persistent server-side progress for authenticated users, localized content structures, per-language video records and versioned cacheable video URLs. Building the simulation around historical data helped us create meaningful feedback without claiming to predict markets.

### Results and Next Steps

We produced an end-to-end learning prototype that joins onboarding, courses, quizzes, multimedia, gamification, simulations, ranking and AI assistance in one product. Backend tests cover the key course, chat, ranking and simulation flows, while the frontend has type and lint checks. We are most proud of making several different learning modes feel like parts of one coherent finance journey.

The current prototype intentionally has limits: videos are stored in the database rather than object storage some personalisation and shop state remain client-side. Next, we would move media to object storage, persist all customisation and onboarding data, expand course and simulation content, add user research and accessibility testing, and introduce stronger production analytics and moderation controls for the AI experience.

We also want to build a complete authoring system for creating and customising courses, lessons and activities, including new activity formats beyond articles, quizzes and videos. Financial partners could create their own verified learning paths. At a defined mastery level, earned through progress and XP, a learner could unlock an integration with a full investment platform. SharkCoins could also become redeemable for real partner rewards from financial institutions, subject to appropriate partner agreements, security controls and regulatory requirements.

## Source Code Repository

[https://github.com/JSamek02/Rekiny-Roberta-Collabothon-2026](https://github.com/JSamek02/Rekiny-Roberta-Collabothon-2026)
