import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Folder, Rocket, Terminal as TerminalIcon, Save, ChevronRight, Upload, Download, Play, Plus, ArrowDownCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';

import { useProject } from '../context/ProjectContext';

export default function IDE() {
  const {
    files,
    setFiles,
    terminalOutput,
    setTerminalOutput,
    activeFile,
    setActiveFile,
    runCommand,
    runCommandFromAI
  } = useProject();

  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorContent, setEditorContent] = useState(files[activeFile]?.content || '');
  const [uploadInfo, setUploadInfo] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  useEffect(() => {
    if (files[activeFile]) setEditorContent(files[activeFile].content);
  }, [activeFile, files]);

  const handleSave = () => {
    setIsSaving(true);
    setFiles(prev => ({ ...prev, [activeFile]: { ...prev[activeFile], content: editorContent } }));
    setTerminalOutput(prev => [...prev, `> Saved ${activeFile}`]);
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleRun = async () => {
    const ext = activeFile.split('.').pop();
    let command = 'npm run dev';
    if (ext === 'js') command = `node ${activeFile}`;
    if (ext === 'ts') command = `npx tsx ${activeFile}`;
    if (ext === 'py') command = `python ${activeFile}`;
    if (ext === 'sh') command = `bash ${activeFile}`;
    if (ext === 'html') command = `python -m http.server 8000`; // quick static server

    setTerminalOutput(prev => [...prev, `> Running ${activeFile} (${command})`]);
    await runCommand(command);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    await runCommand('npm run build');
    const result = await runCommand('echo Deploy started (simulate deployment)');
    if (result && !result.error) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTerminalOutput(prev => [...prev, '✅ Deployment done.'] );
    }
    setIsDeploying(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const name = file.name;
    const language = name.split('.').pop() || 'txt';
    setFiles(prev => ({ ...prev, [name]: { name, content: text, language } }));
    setActiveFile(name);
    setUploadInfo(`Uploaded ${name}`);
    setTerminalOutput(prev => [...prev, `> Uploaded ${name}`]);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    Object.values(files).forEach(file => zip.file(file.name, file.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.zip';
    a.click();
    URL.revokeObjectURL(url);
    setTerminalOutput(prev => [...prev, '> Project downloaded as project.zip']);
  };

  const addNewFile = () => {
    const name = `newfile-${Date.now()}.txt`;
    setFiles(prev => ({ ...prev, [name]: { name, content: '// New file', language: 'text' } }));
    setActiveFile(name);
    setTerminalOutput(prev => [...prev, `> Created ${name}`]);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="w-64 bg-[#0d0d0f] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Explorer</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-zinc-800 text-zinc-400" onClick={addNewFile} title="New File"><Plus className="w-3.5 h-3.5" /></button>
              <label className="p-1 rounded hover:bg-zinc-800 text-zinc-400 cursor-pointer" title="Upload file"><Upload className="w-3.5 h-3.5" /><input onChange={handleFileUpload} type="file" className="hidden" /></label>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {Object.keys(files).map(fileName => (
              <button key={fileName} onClick={() => setActiveFile(fileName)} className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${activeFile === fileName ? 'bg-cyan-500/10 text-cyan-300' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                <FileCode className="w-3.5 h-3.5" /> {fileName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-[#0d0d0f] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-3 gap-2">
            <div>
              <div className="text-xs text-zinc-300">{activeFile}</div>
              <div className="text-[10px] text-zinc-500">Mini editor & runner</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleSave} className="px-2 py-1 rounded bg-slate-700 text-xs text-white hover:bg-slate-600" disabled={isSaving}><Save className="inline w-3 h-3 mr-1" />{isSaving ? 'Saving...' : 'Save'}</button>
              <button onClick={handleRun} className="px-2 py-1 rounded bg-cyan-600 text-xs text-white hover:bg-cyan-500"><Play className="inline w-3 h-3 mr-1" />Run</button>
              <button onClick={() => runCommandFromAI(`Run the ${activeFile} file in this project`)} className="px-2 py-1 rounded bg-indigo-600 text-xs text-white hover:bg-indigo-500">AI Run</button>
              <button onClick={downloadZip} className="px-2 py-1 rounded bg-emerald-600 text-xs text-white hover:bg-emerald-500"><Download className="inline w-3 h-3 mr-1" />Zip</button>
              <button onClick={handleDeploy} disabled={isDeploying} className="px-2 py-1 rounded bg-fuchsia-600 text-xs text-white hover:bg-fuchsia-500 disabled:opacity-50"><Rocket className="inline w-3 h-3 mr-1" />{isDeploying ? 'Deploying...' : 'Deploy'}</button>
            </div>
          </div>
          <textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)} className="flex-1 p-3 bg-[#0b0b0e] text-[13px] text-zinc-200 font-mono border-none outline-none resize-none" />
          <div className="h-8 border-t border-zinc-800 px-3 py-1 text-[11px] text-zinc-400">{uploadInfo}</div>
        </div>
      </div>

      <div className="h-52 bg-[#050506] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="h-9 border-b border-zinc-800 px-3 flex items-center gap-2 text-zinc-300 text-xs uppercase tracking-[0.2em]"><TerminalIcon className="w-3.5 h-3.5" />Terminal</div>
        <div className="flex-1 px-3 py-2 overflow-y-auto font-mono text-[12px] text-zinc-200">
          {terminalOutput.map((line, i) => (
            <div key={i} className={line.startsWith('>') ? 'text-cyan-300 flex items-center gap-1' : 'text-zinc-300'}>
              {line.startsWith('>') ? <ChevronRight className="w-3 h-3" /> : null}
              {line}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
