<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# projectgoogle

A React + Node.js AI assistant web app with voice/text interaction using Gemini.

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

## Features

- Voice assistant with wake phrase and command processing
- Text input fallback for commands
- Gemini AI integration for code and natural language responses
- File operations and terminal control via backend API

## Notes

- Keep API keys secret. Do not commit `.env` to Git.
- If you hit API permission errors, check Google Cloud billing and key restrictions.

