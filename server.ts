import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Generation API - Backend endpoint for Gemini calls
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { command, systemInstruction } = req.body;
      
      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("[Backend] GEMINI_API_KEY not set in environment");
        return res.status(500).json({ error: "API key not configured on server" });
      }

      console.log("[Backend] Initializing Gemini AI client...");
      const genAI = new GoogleGenAI({ apiKey });
      
      const prompt = systemInstruction 
        ? `${systemInstruction}\n\nUser: ${command}`
        : command;

      console.log("[Backend] Making API call to Gemini...");
      const response = await (genAI as any).generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        config: { temperature: 0.7 }
      });
      
      let text = "";
      try {
        text = response.text() ?? "";
      } catch (e) {
        if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
          text = response.candidates[0].content.parts[0].text;
        }
      }

      if (!text) {
        text = "I'm online and ready. Please give me a code command.";
      }

      console.log("[Backend] Response generated successfully");
      res.json({ text, success: true });
      
    } catch (error: any) {
      console.error("[Backend] AI Error:", error);
      const errorMsg = error?.message || "Unknown error";
      
      if (errorMsg.includes("403") || errorMsg.includes("Forbidden")) {
        return res.status(403).json({ 
          error: "Access denied - check API key permissions and billing status",
          details: errorMsg 
        });
      } else if (errorMsg.includes("UNAUTHENTICATED")) {
        return res.status(401).json({ 
          error: "Authentication failed - invalid API key",
          details: errorMsg 
        });
      } else if (errorMsg.includes("quota") || errorMsg.includes("rate limit")) {
        return res.status(429).json({ 
          error: "API quota exceeded",
          details: errorMsg 
        });
      }
      
      res.status(500).json({ error: errorMsg });
    }
  });

  // Terminal Tool API
  app.post("/api/terminal/exec", async (req, res) => {
    const { command, projectId } = req.body;
    
    // In a real sandbox, we'd run this in a specific directory
    // For this demo, we'll simulate the output
    console.log(`Executing command: ${command} for project: ${projectId}`);
    
    let output = "";
    let error = false;

    if (command.includes("npm install")) {
      output = "added 154 packages, and audited 155 packages in 3s\n\nfound 0 vulnerabilities";
    } else if (command.includes("npm build")) {
      output = "vite v6.2.0 building for production...\ntransforming...\n✓ 34 modules transformed.\nrendering chunks...\ndist/index.html                  0.45 kB │ gzip:  0.30 kB\ndist/assets/index-D_m_X_X.css    1.23 kB │ gzip:  0.45 kB\ndist/assets/index-C_y_Z_A.js    145.20 kB │ gzip: 45.12 kB\n✓ built in 1.2s";
    } else if (command.includes("gcloud deploy")) {
      output = "Deploying to Cloud Run...\nService [arvis-project] revision [arvis-project-00001-abc] has been deployed and is serving 100% of traffic.\nService URL: https://arvis-project-abc.a.run.app";
    } else if (command.includes("npm run dev")) {
      output = "> jarvis-project@0.0.0 dev\n> vite\n\n  VITE v6.2.0  ready in 452 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: use --host to expose\n  ➜  press h + enter to show help";
    } else {
      output = `Command not recognized: ${command}`;
      error = true;
    }

    res.json({ output, error });
  });

  // Mock File Upload API
  app.post("/api/upload", (req, res) => {
    // Simulate processing
    console.log("File upload received");
    res.json({ 
      success: true, 
      url: "https://picsum.photos/seed/arvis/800/600",
      message: "File uploaded successfully to A.R.V.I.S. storage"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
