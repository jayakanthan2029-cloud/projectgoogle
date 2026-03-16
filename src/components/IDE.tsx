import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileCode, Folder, Play, Rocket, Terminal as TerminalIcon, Save, ChevronRight, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';

interface File {
  name: string;
  content: string;
  language: string;
}

import { useProject } from '../context/ProjectContext';

export default function IDE() {
  const { 
    files, 
    terminalOutput, 
    activeFile, 
    setActiveFile, 
    runCommand 
  } = useProject();
  
  const [isDeploying, setIsDeploying] = useState(false);
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    await runCommand("npm build");
    const result = await runCommand("gcloud deploy");
    
    if (result && !result.error) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981']
      });
    }
    setIsDeploying(false);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 flex gap-4 min-h-0">
        {/* File Explorer */}
        <div className="w-64 bg-[#0d0d0f] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Explorer</span>
              <div className="flex items-center gap-2" title="Project Browser">
                <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 transition-all" title="Upload Asset">
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <Folder className="w-4 h-4 text-zinc-600" />
              </div>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {Object.keys(files).map(fileName => (
              <button
                key={fileName}
                onClick={() => setActiveFile(fileName)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeFile === fileName ? 'bg-cyan-500/10 text-cyan-400' : 'text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                <FileCode className="w-4 h-4" />
                {fileName}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-[#0d0d0f] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="h-12 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">{activeFile}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all" title="Save File">
                <Save className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDeploy}
                disabled={isDeploying}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isDeploying 
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                <Rocket className={`w-3 h-3 ${isDeploying ? 'animate-bounce' : ''}`} />
                {isDeploying ? 'Deploying...' : 'One-Click Deploy'}
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-sm overflow-auto">
            <pre className="text-zinc-400 leading-relaxed">
              <code>{files[activeFile].content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Terminal Area */}
      <div className="h-48 bg-black border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-2">
          <TerminalIcon className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Terminal</span>
        </div>
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1">
          {terminalOutput.map((line, i) => (
            <div key={i} className={line.startsWith('>') ? 'text-cyan-400' : 'text-zinc-500'}>
              {line.startsWith('>') ? <ChevronRight className="inline w-3 h-3 mr-1" /> : null}
              {line}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
