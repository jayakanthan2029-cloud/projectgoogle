import React, { useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { getGenAI, SYSTEM_INSTRUCTION } from '../services/geminiService';

export default function GlobalVoiceService() {
  const { 
    isListening, setIsListening,
    isProcessing, setIsProcessing,
    setTranscript,
    setLiveTranscript,
    setStatus,
    setErrorMessage,
    setFiles,
    setActiveFile,
    runCommand,
    setActiveStage,
    isVoiceEnabled
  } = useProject();

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);
  const isProcessingRef = useRef(isProcessing);

  // Keep refs in sync with state
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  useEffect(() => {
    if (!isVoiceEnabled) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        recognitionRef.current = null;
      }
      setLiveTranscript("Voice System Offline");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Web Speech API not supported. Please use Chrome or Edge.");
      return;
    }

    let recognition: any = null;

    const startRecognition = () => {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const seg = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += seg;
            else interim += seg;
          }
          
          const full = (final + interim).toLowerCase().replace(/[.,!?;:]/g, "").trim();

          if (!isListeningRef.current) {
            // Wake word detection — silent mode
            const wakeVariations = ['code activate', 'code active', 'cold activate', 'cold active', 'go activate', 'activate'];
            const normalized = full.replace(/\s+/g, ' ').toLowerCase();
            const matched = wakeVariations.find(v => normalized.includes(v));
            
            if (matched) {
              console.log(`[Voice] ✅ Wake-phrase detected: "${full}" (matched: ${matched})`);
              setTranscript(prev => [...prev, `System: 'Code Activate' detected. A.R.V.I.S. is online.`]);
              setLiveTranscript("A.R.V.I.S. Active. Listening for command...");
              setIsListening(true);
              setStatus('active');
              setActiveStage(null);
              setTranscript(prev => [...prev, "A.R.V.I.S. Active. Waiting for instructions..."]);
            } else if (full.length > 0) {
              setLiveTranscript(`Awaiting 'Code Activate'... (heard: ${full.slice(0, 80)})`);
            } else {
              setLiveTranscript("Awaiting 'Code Activate'...");
            }
          } else {
            // Actively listening for commands
            if (!isProcessingRef.current) {
              setLiveTranscript(full || "Listening...");
            }
            if (final.trim().length > 2 && !isProcessingRef.current) {
              console.log(`[Voice] ⚙️ Processing command: "${final.trim()}"`);
              handleVoiceCommand(final.trim());
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'aborted' || event.error === 'no-speech') {
            console.warn(`[Voice] Non-fatal error: ${event.error}`);
            return;
          }
          console.error("[Voice] Error:", event.error);
          if (event.error === 'not-allowed') {
            setStatus('error');
            setErrorMessage("Microphone access denied. Please allow mic access in your browser settings.");
          } else if (event.error === 'network') {
            setStatus('error');
            setErrorMessage("Network error. Speech recognition requires an internet connection.");
          } else if (event.error === 'audio-capture') {
            setStatus('error');
            setErrorMessage("No microphone detected. Please connect a microphone.");
          }
        };

        recognition.onend = () => {
          // Auto-restart if still voice enabled and not in error
          if (isVoiceEnabled && recognitionRef.current === recognition) {
            setTimeout(() => {
              if (isVoiceEnabled && recognitionRef.current === recognition) {
                try { recognition.start(); } catch(e) {}
              }
            }, 300);
          }
        };

        recognition.start();
        setLiveTranscript("Awaiting 'Code Activate'...");
        console.log("[Voice] Recognition started.");
      } catch (e) {
        console.error("[Voice] Failed to start recognition:", e);
      }
    };

    startRecognition();

    return () => {
      recognitionRef.current = null;
      if (recognition) {
        try { recognition.abort(); } catch (e) {}
      }
    };
  }, [isVoiceEnabled]);

  const handleVoiceCommand = async (command: string) => {
    if (isProcessingRef.current) return;

    setIsProcessing(true);
    setTranscript(prev => [...prev, `You: ${command}`]);
    setLiveTranscript("Processing...");
    setStatus('connecting');
    setActiveStage('Thinking');

    // Stop listening during processing to prevent feedback loop
    setIsListening(false);

    try {
      // Stage: Planning after 1.5s
      setTimeout(() => setActiveStage('Planning'), 1500);

      const ai = getGenAI();
      
      const response = await (ai.models as any).generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: 'user',
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nUser: ${command}` }]
        }],
        config: { temperature: 0.7 }
      });

      console.log("[Voice] Raw AI Response:", response);

      // Extract text from response — gemini-2.0-flash returns response.text as a getter
      let text = "";
      try {
        text = response.text ?? "";
      } catch(e) {
        // If response.text is a function (older SDK versions)
        try { text = response.text(); } catch(e2) {}
      }

      // Fallback: dig into candidates structure
      if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      if (!text) text = "I'm online and ready. Please give me a code command.";

      setTranscript(prev => [...prev, `A.R.V.I.S.: ${text}`]);
      setActiveStage('Coding');

      // Code extraction
      const codeBlockRegex = /```(?:typescript|tsx|javascript|js|jsx|html|css|json)?\s*([\s\S]*?)```/g;
      const matches = [...text.matchAll(codeBlockRegex)];

      if (matches.length > 0) {
        const generatedCode = matches[0][1].trim();
        const isPackageJson = generatedCode.includes('"dependencies"') || generatedCode.includes('"name"');
        const fileName = isPackageJson ? 'package.json' : 'App.tsx';
        const language = isPackageJson ? 'json' : 'typescript';

        setTranscript(prev => [...prev, `System: Code generated → injecting into ${fileName}`]);
        setFiles(prev => ({
          ...prev,
          [fileName]: { name: fileName, content: generatedCode, language }
        }));
        setActiveFile(fileName);

        // Run npm install then simulate dev server
        setTimeout(async () => {
          setActiveStage('Testing' as any);
          setTranscript(prev => [...prev, "System: Running 'npm install'..."]);
          await runCommand("npm install");

          setTimeout(async () => {
            setActiveStage('Monitoring');
            setTranscript(prev => [...prev, "System: Starting development runtime..."]);
            await runCommand("npm run dev");
            setTranscript(prev => [...prev, "A.R.V.I.S.: Process complete. Application is now live on http://localhost:5173"]);
          }, 2000);
        }, 1000);
      } else {
        setActiveStage('Monitoring');
        setTimeout(() => setActiveStage(null), 3000);
      }

      setStatus('active');

    } catch (error: unknown) {
      console.error("[Voice] AI Error:", error);

      let userMessage = "Unknown AI error. Please try again.";
      let shortMsg = "Unknown error";

      if (error && typeof error === 'object') {
        const errObj = error as Record<string, any>;
        const detailMessage = errObj.message || errObj.error?.message || errObj.error?.details || errObj.error?.description;
        const statusCode = errObj.code || errObj.status || errObj.error?.code;

        if (statusCode === 429 || statusCode === 'RESOURCE_EXHAUSTED' || (typeof detailMessage === 'string' && detailMessage.toLowerCase().includes('quota'))) {
          userMessage = "Your Gemini quota is exhausted. Please wait, reduce request frequency, or upgrade your Google Cloud AI quota/billing plan.";
          shortMsg = "Quota exceeded (429/resource_exhausted)";
        } else if (detailMessage) {
          userMessage = detailMessage;
          shortMsg = detailMessage;
        } else if (statusCode) {
          userMessage = `AI service error (code: ${statusCode}).`;
          shortMsg = `code: ${statusCode}`;
        }
      } else if (typeof error === 'string') {
        userMessage = error;
        shortMsg = error;
      }

      setTranscript(prev => [...prev, `A.R.V.I.S.: ${userMessage}`]);
      setStatus('error');
      setErrorMessage(userMessage);
      setActiveStage(null);

      // Add a visible tip log for 429 to reduce repeated calls
      if (shortMsg.includes('Quota exceeded') || shortMsg.includes('429') || shortMsg.includes('RESOURCE_EXHAUSTED')) {
        setTranscript(prev => [...prev, 'System: Tip — If you are triggering too many requests, pause voice commands for 1 minute.']);
      }
    } finally {
      setIsProcessing(false);
      // Resume listening after command is processed
      setTimeout(() => {
        if (isVoiceEnabled) {
          setIsListening(true);
          setLiveTranscript("Listening for next command...");
        }
      }, 1500);
    }
  };

  return null;
}
