import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Database, Cpu, HardDrive, Check, X, Sparkles, LogIn, LogOut } from 'lucide-react';

interface SettingsProps {
  user: any;
  onGoogleLogin: () => void;
}

export default function Settings({ user, onGoogleLogin }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('agent');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [creativity, setCreativity] = useState(40);
  const [continuousVoice, setContinuousVoice] = useState(true);
  
  // API Keys state
  const [apiKey, setApiKey] = useState('*************************');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [projectId, setProjectId] = useState('arvis-gen-lang-client');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [tempProject, setTempProject] = useState('');

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey);
      // In a real app, this would update .env or a backend
      setIsEditingKey(false);
    }
  };

  const handleSaveProject = () => {
    if (tempProject.trim()) {
      setProjectId(tempProject);
      setIsEditingProject(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-zinc-500 mt-1">Configure A.R.V.I.S. operational parameters and user preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation / Categories */}
        <div className="col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('agent')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === 'agent' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'text-zinc-400 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-5 h-5" />
            <span className="font-medium text-sm">Agent Engine</span>
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === 'account' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'text-zinc-400 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">Account</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === 'notifications' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'text-zinc-400 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium text-sm">Notifications</span>
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === 'security' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'text-zinc-400 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium text-sm">Security & Privacy</span>
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === 'data' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'text-zinc-400 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="font-medium text-sm">Data & Cloud</span>
          </button>
        </div>

        {/* Current Category Settings */}
        <div className="col-span-2 space-y-6">
          {activeTab === 'agent' && (
            <>
              <div className="bg-[#0d0d0f] border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-500" /> Model Configuration
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Active AI Model</label>
                    <select 
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                      title="Select AI Model"
                      aria-label="Select AI Model"
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (High Speed)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Complex Reasoning)</option>
                      <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                    </select>
                    <p className="text-xs text-zinc-500">Determines the backend LLM used for code generation and multimodal reasoning.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex justify-between">
                      Agent Creativity (Temperature)
                      <span className="text-emerald-500 font-mono">{(creativity / 100).toFixed(1)}</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={creativity} 
                      onChange={(e) => setCreativity(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer" 
                      title="Adjust Agent Creativity"
                      aria-label="Adjust Agent Creativity"
                    />
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Precise (0.0)</span>
                      <span>Balanced (0.4)</span>
                      <span>Creative (1.0)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-200">Continuous Voice Monitoring</h4>
                      <p className="text-xs text-zinc-500">Keep microphone active in background to listen for wake word.</p>
                    </div>
                    <div 
                      onClick={() => setContinuousVoice(!continuousVoice)}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        continuousVoice ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-sm ${
                        continuousVoice ? 'right-1' : 'left-1'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0d0d0f] border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-500" /> API Integrations
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Google Cloud API Key</label>
                    <div className="flex gap-2">
                      <input 
                        type={isEditingKey ? "text" : "password"} 
                        value={isEditingKey ? tempKey : apiKey} 
                        onChange={(e) => setTempKey(e.target.value)}
                        readOnly={!isEditingKey} 
                        placeholder="Enter API Key"
                        className={`flex-1 bg-zinc-900 border rounded-xl px-4 py-2.5 text-sm transition-all ${
                          isEditingKey ? 'border-emerald-500 text-zinc-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-zinc-800 text-zinc-500'
                        }`} 
                      />
                      {isEditingKey ? (
                        <div className="flex gap-1">
                          <button onClick={handleSaveKey} title="Save" className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 outline-none"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setIsEditingKey(false)} title="Cancel" className="p-2.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 outline-none"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setIsEditingKey(true); setTempKey(apiKey === '*************************' ? '' : apiKey); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">Edit</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'account' && (
            <div className="bg-[#0d0d0f] border border-zinc-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" /> Account Identity
              </h3>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="w-16 h-16 rounded-full border-2 border-zinc-800 overflow-hidden flex items-center justify-center bg-zinc-800">
                   {user?.photoURL ? (
                     <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <User className="w-8 h-8 text-zinc-600" />
                   )}
                </div>
                <div>
                  <h4 className="text-white font-bold">{user?.displayName || 'Guest User'}</h4>
                  <p className="text-zinc-500 text-sm">{user?.email || 'Local Sandbox Mode'}</p>
                </div>
              </div>

              {user?.uid === 'guest-user' && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Cloud Sync Available
                  </h4>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    You are currently using A.R.V.I.S. in guest mode. Sign in with Google to persist your projects across devices and enable Google Drive activity logs.
                  </p>
                  <button 
                    onClick={onGoogleLogin}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in with Google
                  </button>
                </div>
              )}

              <div className="space-y-3 pt-4">
                 <button className="w-full text-left p-4 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 transition-all group">
                   <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Export Local Workspace</p>
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Download all project source files as a ZIP</p>
                 </button>
                 {user?.uid !== 'guest-user' && (
                   <button className="w-full text-left p-4 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-all group">
                     <p className="text-sm font-bold text-red-400">Security Terminate</p>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Signs out from all active cloud sessions</p>
                   </button>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
