# IJP (Ishan Janta Party) Website - Full Context & Architecture Guide

## Overview
The IJP website is a React-based web application tailored for a fictional/school-based bureaucratic system ("Ishan Janta Party" - Directorate of Truth). It features a dystopian, bureaucratic aesthetic, with varying access levels for standard operatives (students) and administrators (Directorate).

## Tech Stack & Core Libraries
- **Frontend Framework:** React (via Vite)
- **Routing:** React Router v7 (`react-router-dom`)
- **Styling:** Tailwind CSS (via CDN in `index.html` with custom Material Design 3 tokens)
- **Icons/Fonts:** Google Fonts (Anton, Inter) & Material Symbols Outlined
- **Backends (Dual-Fallback Architecture):**
  1. **Supabase (Primary):** Handles Authentication, PostgreSQL Database (Realtime subscriptions, RLS enabled), and Storage (ID card uploads).
  2. **Firebase (Fallback):** Firestore & Firebase Auth act as a highly resilient fallback if Supabase fails or hits limits.
- **AI Integrations:** NVIDIA API (`nvidia/nemotron-4-340b-instruct`) for the "Central Intelligence" chatbot and dynamic homework generation. Fallback/Original intent was OpenAI.

## Backend Architecture & Services
The application is heavily built on a custom `dbService` (`src/services/db.js`) which abstracts the dual-backend logic. 
- **Failover Logic:** Every major read/write operation attempts Supabase first. If it fails or times out (5s), it fails over to Firebase Firestore.
- **Authentication Resilience:** Auth attempts Supabase -> Firebase -> Supabase (retry) to ensure users can always log in.
- **Rate Limiting:** A strict client-side leaky-bucket rate limiter (`localStorage`-based) restricts auth/signup to 32,767 requests per 5 minutes to prevent basic bot flooding.
- **Realtime:** Supabase Realtime is used extensively for instant updates in Admin Dashboards and Chat (Secure Comms Link).

## Key Files & Directory Structure

### `src/` Root
- `App.jsx`: Main routing file. Handles protected routes (`<ProtectedRoute>`) and displays a critical warning banner if Netlify environment variables are missing.
- `main.jsx`: React root mounting.
- `supabaseClient.js`: Initializes Supabase. Includes fallback placeholder URLs to prevent hard crashes if `VITE_SUPABASE_URL` is missing on build.
- `firebaseClient.js`: Initializes Firebase app, auth, and firestore.

### `src/context/`
- `AuthContext.jsx`: Manages global user state, handles login, signup (including D-Number ID generation and ID card uploads), password resets, and session persistence. Syncs real-time profile updates.

### `src/services/`
- `db.js`: The unified dual-backend service layer. Contains all `insert`, `fetch`, `update`, and `delete` methods for `profiles`, `munitions` (homework), `complaints`, and `chat_messages`.

### `src/utils/`
- `openai.js`: Houses the `executeNvidia` wrapper. Contains functions to `processMunition` (categorize and format student-submitted intel), `generateRandomIntel` (auto-generate homework tasks), and `getChatbotResponse` (for the AI Chatbot).

### `src/pages/`
- **Public:** `Home.jsx` (Landing page), `Manifesto.jsx`, `Login.jsx`, `Signup.jsx`.
- **Protected (Student & Admin):**
  - `Profile.jsx`: Operative Dossier showing ID status, section, and a prominent warning if unverified.
  - `StudentHub.jsx`: Grade 9 Hub. Displays current 'Munitions' (homework/exam intel) for the student's section. Includes a task completion tracker (`localStorage` based).
  - `TruthDirectorate.jsx`: Reporting tools. Allows users to submit "complaints" or "intel".
  - `CommsLink.jsx`: The secure chat interface. For students, it's a chatbot by default.
  - `HomeworkTracker.jsx`: Dedicated page for tracking assignments.
- **Protected (Admin Only):**
  - `AdminDashboard.jsx`: Massive control panel. Shows total recruits, pending complaints, handles verification toggles, and allows promoting users to admin.
  - `CommsLink.jsx` (Admin Mode): Features a responsive split-pane UI. Admins see active inbound threads separate from inactive contacts, allowing 1-on-1 chats with any operative.

## Deployment & Production
- **Host:** Netlify (configured via `public/_redirects` to handle client-side routing).
- **Environment Variables Required:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_OPENAI_API_KEY` (or `VITE_NVIDIA_API_KEY` depending on current active AI)
- **Local Dev:** `npm run dev`
- **Build:** `npm run build` (Currently builds perfectly with no errors).

## Recent Major Updates
1. **White Screen Fix:** Handled missing Netlify ENV vars gracefully in `supabaseClient.js` to prevent Vite build/runtime crashes.
2. **Admin Comms Overhaul:** Upgraded `CommsLink.jsx` to a premium split-pane UI for admins, separating active conversations from the full directory.
3. **Dual-Backend Switch:** fully migrated from raw Supabase calls in components to the unified `dbService` fallback pattern.

## Guidelines for Future AI Coders
1. **Always use `dbService`:** Do not write direct `supabase.from()` calls in React components for CRUD operations. Add methods to `dbService` to ensure Firebase failover is respected. (Note: Supabase `channel` subscriptions remain in components for realtime capabilities).
2. **Maintain Tone:** The application utilizes a very specific aesthetic: bureaucratic, dystopian, pseudo-military (e.g., "Munitions" instead of "Homework", "Operative" instead of "Student"). Maintain this tone in all UI text and AI prompts.
3. **Styling Limitations:** Do not rewrite the Tailwind theme configuration in `index.html`. It uses specific Material Design color tokens (e.g., `bg-surface-container-highest`, `text-on-surface`).
4. **Environment Variables:** Remember that Vite requires the `VITE_` prefix for client-side environment variables.
