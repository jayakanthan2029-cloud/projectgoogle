import React, { createContext, useContext, useState, ReactNode } from 'react';

interface File {
  name: string;
  content: string;
  language: string;
}

interface ProjectContextType {
  files: Record<string, File>;
  setFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  terminalOutput: string[];
  setTerminalOutput: React.Dispatch<React.SetStateAction<string[]>>;
  activeFile: string;
  setActiveFile: (name: string) => void;
  runCommand: (cmd: string) => Promise<any>;
  // Voice State
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  transcript: string[];
  setTranscript: React.Dispatch<React.SetStateAction<string[]>>;
  liveTranscript: string;
  setLiveTranscript: (val: string) => void;
  status: 'idle' | 'connecting' | 'active' | 'error';
  setStatus: (s: 'idle' | 'connecting' | 'active' | 'error') => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  activeStage: string | null;
  setActiveStage: (stage: string | null) => void;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (val: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<Record<string, File>>({
    'App.tsx': {
      language: 'typescript',
      name: 'App.tsx',
      content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-black text-white flex items-center justify-center">\n      <h1 className="text-4xl font-bold text-cyan-500">Hello from A.R.V.I.S.</h1>\n    </div>\n  );\n}`
    },
    'server.ts': {
      language: 'typescript',
      name: 'server.ts',
      content: `import express from 'express';\n\nconst app = express();\napp.get('/', (req, res) => res.send('API Online'));\napp.listen(3000);`
    },
    'package.json': {
      language: 'json',
      name: 'package.json',
      content: `{\n  "name": "jarvis-project",\n  "dependencies": {\n    "express": "^4.18.2",\n    "react": "^18.2.0"\n  }\n}`
    }
  });

  const [terminalOutput, setTerminalOutput] = useState<string[]>(["A.R.V.I.S. Terminal v1.0.0", "Ready for commands..."]);
  const [activeFile, setActiveFile] = useState<string>('App.tsx');

  // New Voice State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const runCommand = async (cmd: string) => {
    setTerminalOutput(prev => [...prev, `> ${cmd}`]);
    
    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, projectId: 'demo' })
      });
      const data = await res.json();
      setTerminalOutput(prev => [...prev, ...data.output.split('\n')]);
      return data;
    } catch (err) {
      setTerminalOutput(prev => [...prev, "Error: Failed to execute command"]);
      return { error: true };
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      files, 
      setFiles, 
      terminalOutput, 
      setTerminalOutput, 
      activeFile, 
      setActiveFile,
      runCommand,
      isListening, setIsListening,
      isProcessing, setIsProcessing,
      transcript, setTranscript,
      liveTranscript, setLiveTranscript,
      status, setStatus,
      errorMessage, setErrorMessage,
      activeStage, setActiveStage,
      isVoiceEnabled, setIsVoiceEnabled
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
