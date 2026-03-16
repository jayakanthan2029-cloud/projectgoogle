import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Sparkles, Terminal as TerminalIcon, Image as ImageIcon, X, Power, Send } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { SYSTEM_INSTRUCTION } from '../services/geminiService';

export default function VoiceInterface() {
  const { 
    isListening, setIsListening,
    isProcessing, setIsProcessing,
    transcript, setTranscript,
    liveTranscript, setLiveTranscript,
    status, setStatus,
    errorMessage, setErrorMessage,
    isVoiceEnabled, setIsVoiceEnabled,
    activeStage, setActiveStage
  } = useProject();
  
  const [isSupported, setIsSupported] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setIsSupported(false);
  }, []);

  const togglePower = () => {
    if (isVoiceEnabled) {
      setIsVoiceEnabled(false);
      setIsListening(false);
      setStatus('idle');
      setTranscript(prev => [...prev, "System: Voice System powered down. Privacy mode active."]);
    } else {
      setIsVoiceEnabled(true);
      setIsListening(false); // keep in wake-word mode until activation phrase is heard
      setStatus('active');
      setTranscript(prev => [...prev, "System: Initializing neural link... Voice System Online."]);
      setLiveTranscript("Awaiting 'Code Activate'...");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setStatus('active');
    } else {
      setIsListening(true);
      setStatus('active');
      setTranscript(prev => [...prev, "System: Manual session started."]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setSelectedImage(reader.result as string);
        setTranscript(prev => [...prev, `[System: Image '${file.name}' attached for analysis]`]);
        setStatus('connecting');
        
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({ fileName: file.name, type: file.type }),
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await response.json();
          if (data.success) {
            setTranscript(prev => [...prev, "A.R.V.I.S.: Image data verified via Cloud Storage."]);
            setStatus('active');
          }
        } catch (err) {
          console.error("Upload error:", err);
          setStatus('error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextSubmit = () => {
    const command = textInput.trim().toLowerCase();
    if (!command) return;
    
    // Check for wake words (Code Activate, Code Active, Activate, etc.)
    const wakeVariations = ['code activate', 'code active', 'activate', 'cold activate', 'go activate'];
    const isWakeWord = wakeVariations.some(word => command.includes(word));
    
    // If it's a wake word, activate listening mode (turn on microphone)
    if (isWakeWord) {
      console.log(`[Text] ✅ Wake-phrase detected: "${command}"`);
      setTranscript(prev => [...prev, `System: 'Code Activate' detected via text. Microphone activated.`]);
      setLiveTranscript("A.R.V.I.S. Active. Listening for command...");
      setIsListening(true);
      setStatus('active');
      setTranscript(prev => [...prev, "A.R.V.I.S. Active. Waiting for instructions..."]);
      setTextInput('');
      return;
    }
    
    // For any other text command, process it directly (no wake word needed)
    console.log(`[Text] Processing command: "${command}"`);
    setTranscript(prev => [...prev, `You: ${command}`]);
    setTextInput('');
    
    // Trigger the voice command handler
    setTimeout(() => {
      handleVoiceCommand(command);
    }, 300);
  };

  const handleVoiceCommand = async (command: string) => {
    console.log('[VoiceInterface] Processing command:', command);
    const { runCommand } = useProject();

    if (isProcessing) {
      console.log('[VoiceInterface] Already processing, skipping');
      return;
    }

    setIsProcessing(true);
    setTranscript(prev => [...prev, `System: Processing command...`]);
    setLiveTranscript("Processing...");
    setStatus('connecting');
    setActiveStage('Thinking');

    // Stop listening during processing
    setIsListening(false);

    try {
      console.log('[VoiceInterface] Calling backend AI endpoint...');
      setTimeout(() => setActiveStage('Planning'), 1500);

      // Call the backend API instead of calling Gemini directly from frontend
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: command,
          systemInstruction: SYSTEM_INSTRUCTION
        })
      });

      console.log('[VoiceInterface] Backend response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[VoiceInterface] API response received:', data);

      const text = data.text || "I'm online and ready. Please give me a code command.";

      setTranscript(prev => [...prev, `A.R.V.I.S.: ${text}`]);
      setActiveStage('Coding');
      setStatus('active');

    } catch (error: any) {
      console.error('[VoiceInterface] AI Error:', error);
      const errorMsg = error?.message || "AI service error";
      
      // Check for common API errors
      if (errorMsg.includes('API key') || errorMsg.includes('authentication')) {
        setTranscript(prev => [...prev, `A.R.V.I.S.: API authentication error. Contact your admin to check backend API key configuration.`]);
      } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
        setTranscript(prev => [...prev, `A.R.V.I.S.: Access denied. The backend API key may have permission issues. Contact your admin.`]);
      } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
        setTranscript(prev => [...prev, `A.R.V.I.S.: API quota exceeded. Please try again later.`]);
      } else if (errorMsg.includes('UNAUTHENTICATED')) {
        setTranscript(prev => [...prev, `A.R.V.I.S.: Authentication failed on backend. Check API key configuration.`]);
      } else {
        setTranscript(prev => [...prev, `A.R.V.I.S.: ${errorMsg}`]);
      }
      
      setStatus('error');
      setErrorMessage(errorMsg);
      setActiveStage(null);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setIsListening(true);
        setLiveTranscript("Listening for next command...");
      }, 1500);
    }
  };

  if (!isVoiceEnabled) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0d0d0f]/50 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl relative group">
          <div className="absolute inset-0 bg-red-500/5 blur-2xl rounded-full animate-pulse opacity-50" />
          <MicOff className="w-10 h-10 text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Voice Interface Offline</h2>
        <p className="text-zinc-500 max-w-sm mb-8">
          The autonomous voice system is currently inactive to ensure total privacy. Click below to initialize the neural link.
        </p>
        <button 
          onClick={togglePower}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 flex items-center gap-2"
        >
          <Mic className="w-5 h-5" />
          Initialize A.R.V.I.S. Voice System
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-8">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
        aria-label="Upload Image"
      />
      
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <button 
          onClick={togglePower}
          className="absolute top-0 right-0 p-2 text-zinc-600 hover:text-red-400 transition-colors"
          title="Deactivate Voice System"
        >
          <Power className="w-5 h-5" />
        </button>

        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-125 h-125 rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" />
        </div>

        <div className="mb-6 flex flex-col items-center gap-4">
           {liveTranscript && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="px-4 py-2 bg-zinc-900/80 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-mono shadow-[0_0_15px_rgba(16,185,129,0.1)]"
             >
               {liveTranscript.includes("Awaiting") ? "Status: " : "Hearing: "} <span className="text-white">"{liveTranscript}"</span>
             </motion.div>
           )}
        </div>

        <motion.div 
          animate={{ 
            scale: isListening ? [1, 1.1, 1] : 1,
            boxShadow: isListening 
              ? ["0 0 20px rgba(6,182,212,0.3)", "0 0 60px rgba(6,182,212,0.6)", "0 0 20px rgba(6,182,212,0.3)"] 
              : "0 0 0px rgba(6,182,212,0)"
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-500 relative ${
            isListening ? (isProcessing ? 'bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 'bg-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]') + ' text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
          onClick={toggleListening}
        >
          {isProcessing ? (
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            isListening ? <Mic className="w-12 h-12" /> : <MicOff className="w-12 h-12" />
          )}
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-cyan-400 transition-all shadow-xl"
            title="Upload Image"
            aria-label="Upload Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </motion.div>

        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 relative group"
          >
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="w-32 h-32 object-cover rounded-xl border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove Image"
              aria-label="Remove Image"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {!isSupported ? "Voice Not Supported" : (status === 'error' ? "Interface Halted" : (isProcessing ? "Processing Logic..." : (isListening ? "Voice & Text Active" : "Text Ready - Say 'Code Activate' for Voice")))}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-2">
            {!isSupported ? (
              <p className="text-amber-400 text-sm">Web Speech API not supported. Use Chrome or Edge.</p>
            ) : status === 'error' ? (
              <div className="bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 max-w-md">
                <p className="text-red-400 text-sm font-medium">Error: {errorMessage || "Check microphone and API keys."}</p>
              </div>
            ) : !isListening && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Awaiting: "Code Activate" (voice)</span>
              </div>
            )}
          </div>
        </div>

        {isListening && !isProcessing && (
          <div className="mt-12 flex items-center gap-1 h-12">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [10, Math.random() * 40 + 10, 10], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                className="w-1 bg-cyan-500 rounded-full"
              />
            ))}
          </div>
        )}

        <div className="mt-8 w-full max-w-2xl px-4">
          <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-3 shadow-xl">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder={isListening ? "Type a command..." : "Type a command or 'Code Activate' for voice..."}
              className="flex-1 bg-transparent text-white placeholder-zinc-600 outline-none text-sm font-mono"
              aria-label="Text command input"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isProcessing}
              className="p-2 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send text command"
              aria-label="Send text command"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-64 bg-[#0d0d0f] border border-zinc-800 rounded-2xl p-6 overflow-y-auto flex flex-col gap-4 backdrop-blur-sm shadow-inner group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">
            <TerminalIcon className="w-3 h-3" />
            <span>Core Session Log</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        
        {transcript.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-zinc-700 italic text-sm">
            Text commands work immediately. Say or type "Code Activate" for voice mode.
          </div>
        )}

        {transcript.map((line, i) => {
          const isSystem = line.startsWith('System:');
          const isAI = line.startsWith('A.R.V.I.S.:');
          return (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className={`flex gap-3 ${isSystem ? 'bg-zinc-800/30 p-2 rounded-lg' : ''}`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${isAI ? 'bg-cyan-500/10' : 'bg-zinc-800'}`}>
                <Sparkles className={`w-3 h-3 ${isAI ? 'text-cyan-400' : 'text-zinc-600'}`} />
              </div>
              <p className={`text-sm leading-relaxed ${isSystem ? 'text-zinc-500 font-mono text-xs' : 'text-zinc-300'}`}>{line}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
