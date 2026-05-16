# GenAI Chatbot Implementation Plan

## Goal
Build an inbuilt AI chatbot into this React app to help users plan workouts, substitute exercises, and analyze their progress. The goal is to package this as a CV-ready project (meaning no friction or local setup required for an employer to view it).

## Architecture & Scope
1. **Model:** Google Gemini 2.0 Flash (Free tier, fast, high context window).
2. **Context (RAG):** The bot will be fed data from `exercises.csv` and the user's local workout history so it understands the app's capabilities.
3. **Core Features:**
   - Exercise substitutions & form guidance.
   - On-the-fly workout generation based on available equipment.
   - Progress analysis based on logged sessions.
4. **Hosting Strategy (CRITICAL):**
   - The React app must be hosted on **Vercel** (not standard GitHub Pages).
   - We will use a Vercel Serverless Function to securely hide the Gemini API Key. This allows an employer to use the bot instantly without needing to input their own key.

## Next Steps for the AI Assistant:
1. **Phase 1 (UI):** Build a floating Chatbot UI component in React that can toggle open/closed.
2. **Phase 2 (Logic):** Connect the UI to a mock response system, then wire up the context gathering (reading the CSV and local state).
3. **Phase 3 (Backend):** Set up the Vercel serverless function and integrate the actual Gemini API call.
4. **Phase 4 (Deployment):** Initialize/Fix Git, push to a new GitHub repo, and deploy on Vercel.

**AI Note:** Start immediately with Phase 1 by creating the Chatbot UI component!
