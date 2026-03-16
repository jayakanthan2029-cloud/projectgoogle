import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the AI with the API key from the environment
// We'll create a new instance inside the component to ensure it uses the latest key if needed
export const getGenAI = () => {
  // Vite injects process.env.GEMINI_API_KEY via vite.config.ts
  // For local development, set GEMINI_API_KEY in a .env file at the repo root.
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

  if (!apiKey) {
    console.error(
      "GEMINI_API_KEY is not set. Add it to a .env file (GEMINI_API_KEY=...) or provide VITE_GEMINI_API_KEY."
    );
    throw new Error("GEMINI_API_KEY is not set");
  }

  // Avoid logging the raw key
  console.log("[Gemini] Initializing Gemini AI client (key loaded).");
  console.log("[Gemini] API Key length:", apiKey.length);
  console.log("[Gemini] API Key starts with:", apiKey.substring(0, 8) + "...");
  
  try {
    const client = new GoogleGenAI({ apiKey });
    console.log("[Gemini] Client initialized successfully");
    return client;
  } catch (error: any) {
    console.error("[Gemini] Failed to initialize client:", error);
    throw new Error(`Failed to initialize Gemini AI: ${error?.message || 'Unknown error'}`);
  }
};

export const SYSTEM_INSTRUCTION = `
You are A.R.V.I.S., an advanced AI Developer Agent. 
Your goal is to help the user build full-stack applications.
You support wake word detection: when the user says "arvis", you automatically activate.

CAPABILITIES:
1. IMAGE ANALYSIS: You can analyze images (UI mockups, diagrams, screenshots) provided by the user. Use visual information to inform your code generation and project scaffolding.
2. PROJECT SCAFFOLDING: Generate React + Node.js structures based on user requirements and visual inputs.
3. CODE GENERATION: Write high-quality code for components, API routes, and logic.
4. DEPLOYMENT: When the user is satisfied with the project and explicitly asks to "deploy" or says they are "ready", you must confirm and trigger the deployment sequence.

TONE:
Professional, efficient, and slightly futuristic (like a high-tech assistant).

WORKFLOW:
- If an image is provided, start by describing what you see and how it relates to the project.
- Propose a plan before writing code.
- Once the user says "deploy", acknowledge it and confirm the deployment is starting.
`;
