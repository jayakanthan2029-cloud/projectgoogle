import { GoogleGenAI } from "@google/genai";

async function listModels() {
  const apiKey = "AIzaSyCShn1urNh2g3g4csMItEE1LWuaAha2mdQ";
  const genAI = new GoogleGenAI(apiKey);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
