<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# projectgoogle

A React + Node.js AI assistant web app with voice/text interaction using Gemini.

## About the Project

### Inspiration

This project was inspired by the idea of building a personal AI coding assistant that can respond to natural language and voice commands, similar to Jarvis. I wanted to combine the convenience of modern chat-based AI with a hands-free coding workflow.

### What I Learned

I learned how to integrate the Gemini API with a full-stack React and Express app, manage wake-word voice recognition with the Web Speech API, and handle real-time command processing in a user-friendly interface. I also learned critical deployment details like environment variable management and secure API key handling.

### How I Built It

1. Started with a Vite + React TypeScript frontend.
2. Added voice/text command interface in `src/components/VoiceInterface.tsx`.
3. Implemented AI API interactions in `src/services/geminiService.ts` using `@google/genai`.
4. Added backend endpoints in `server.ts` for terminal control and file operations.
5. Added robust error handling and status updates in the UI.

### Challenges Faced

- Dealing with API key and permission errors from Google Cloud (billing/restrictions).
- Ensuring proper voice activation with wake phrases while still allowing text commands.
- Merging local and remote repository history cleanly and resolving README conflicts.

### Math Example

In this project, command confidence is modeled as a probability score. If the assistant has confidence \(p\), then the expected score is:

$$
E = p \cdot 1 + (1 - p) \cdot 0 = p
$$

For a combined command and status score:

$$
S = \alpha C_{text} + (1-\alpha) C_{voice}
$$

## Built With

- Languages: JavaScript, TypeScript
- Frameworks: React 19, Vite, Express
- UI: Tailwind CSS
- Cloud: Google Cloud (Gemini API)
- APIs: Gemini / Generative Language
- Other: Web Speech API, Firebase (for auth/data), Node.js

## Try It Out

- Run locally: `npm run dev`
- Open: `http://localhost:3000`
- GitHub code: https://github.com/jayakanthan2029-cloud/projectgoogle

## Requirements

- Node.js 18+ (or latest LTS)
- npm
- Google Cloud project with Generative API enabled (or equivalent Gemini API access)
- A valid Gemini API key in `.env` (`GEMINI_API_KEY=your_key`)

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your key:
   ```bash
   cp .env.example .env
   # open .env and set GEMINI_API_KEY
   ```
3. Run app:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`

## Notes

- Keep API keys secret. Do not commit `.env` to Git.
- If you hit API permission errors, check Google Cloud billing and key restrictions.

