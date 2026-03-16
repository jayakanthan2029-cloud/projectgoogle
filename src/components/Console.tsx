import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Folder, Circle, Activity, BarChart3, LineChart, Plus, Check, X } from 'lucide-react';
import VoiceInterface from './VoiceInterface';
import IDE from './IDE';
import { useProject } from '../context/ProjectContext';
import { db, auth, collection, query, where, getDocs, addDoc, serverTimestamp } from '../firebase';

interface ConsoleProps {
  onActivity?: (type: string, details: string) => void;
}

export default function Console({ onActivity }: ConsoleProps) {
  const { activeStage, setActiveStage } = useProject();
  const [ramUsage, setRamUsage] = useState(42.5);
  const [freeLimit, setFreeLimit] = useState(68.2);

  // Real-time states
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [deployTime, setDeployTime] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployments, setDeployments] = useState<{name: string, time: number}[]>([]);

  // Project management states
  const [projects, setProjects] = useState<string[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setIsLoadingProjects(true);
      try {
        const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const projectNames = querySnapshot.docs.map(doc => doc.data().name as string);
        setProjects(projectNames);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const handleAddProject = async () => {
    const user = auth.currentUser;
    if (newProjectName.trim() && user) {
      const name = newProjectName.trim();
      try {
        // Save to Firestore
        await addDoc(collection(db, 'projects'), {
          name,
          userId: user.uid,
          status: 'draft',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update local UI state
        setProjects(prev => [...prev, name]);
        setActiveProject(name);
        setNewProjectName('');
        setIsAddingProject(false);
        onActivity?.('project_created', `Created project ${name}`);
      } catch (error) {
        console.error("Error adding project:", error);
      }
    }
  };

  useEffect(() => {
    // RAM and Limit simulation
    const interval = setInterval(() => {
      setRamUsage(prev => Math.min(Math.max(prev + (Math.random() - 0.5) * 8, 20), 85));
      setFreeLimit(prev => Math.min(Math.max(prev + (Math.random() - 0.5) * 12, 30), 95));
    }, 1000);

    // Deployments active time ticking simulation
    const deployInterval = setInterval(() => {
      setDeployments(prev => prev.map(dep => ({
        ...dep,
        time: dep.time + 1
      })));
    }, 60000); // Ticks every minute

    return () => {
      clearInterval(interval);
      clearInterval(deployInterval);
    };
  }, []);

  const handleDeploy = () => {
    if (!activeProject || isDeploying) return;
    setIsDeploying(true);
    // Simulate a deployment process
    setTimeout(() => {
      setDeployments(prev => [{ name: activeProject, time: 0 }, ...prev]);
      setIsDeploying(false);
      onActivity?.('deploy_started', `Deployment started for ${activeProject}`);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 h-full w-full gap-4 p-4 overflow-hidden">
      {/* Column 1: Left */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-full min-h-0">
        
        {/* User Station */}
        <div className="bg-[#0d0d0f] border border-zinc-800 rounded-2xl flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300">User Station</h3>
          </div>
          <div className="p-4 flex-1">
            <p className="text-xs font-semibold text-zinc-500 mb-2">Charts</p>
            <div className="flex flex-col gap-4 justify-center h-28 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="text-emerald-400 flex items-center gap-1.5"><Activity className="w-3 h-3" /> RAM Occupation</span>
                  <span className="text-zinc-400 font-mono">{ramUsage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                  <motion.div 
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    animate={{ width: `${ramUsage}%` }}
                    transition={{ type: 'tween', ease: 'linear', duration: 1 }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="text-cyan-400 flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> Free Limit</span>
                  <span className="text-zinc-400 font-mono">{freeLimit.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                  <motion.div 
                    className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    animate={{ width: `${freeLimit}%` }}
                    transition={{ type: 'tween', ease: 'linear', duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Workspace & Health */}
        <div className="bg-[#0d0d0f] border border-zinc-800 rounded-2xl flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300">User Workspace & Health</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* My Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">My Projects</p>
                <button 
                  onClick={() => setIsAddingProject(true)}
                  className="flex items-center gap-1 p-1 pr-2 hover:bg-zinc-800/80 rounded-md text-zinc-500 hover:text-cyan-400 transition-colors"
                  title="Add New Project"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-60">New Project</span>
                </button>
              </div>
              <div className="space-y-2">
                {isAddingProject && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                     <Folder className="w-4 h-4 text-cyan-500/80 shrink-0" />
                     <input 
                       className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full"
                       autoFocus
                       value={newProjectName}
                       onChange={e => setNewProjectName(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleAddProject()}
                       placeholder="Project name..."
                     />
                     <button 
                       onClick={handleAddProject} 
                       className="text-emerald-400 hover:text-emerald-300 p-1 hover:bg-zinc-800 rounded transition-colors"
                       title="Save Project"
                       aria-label="Save Project"
                     >
                       <Check className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => { setIsAddingProject(false); setNewProjectName(''); }} 
                       className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded transition-colors"
                       title="Cancel"
                       aria-label="Cancel"
                     >
                       <X className="w-4 h-4" />
                     </button>
                  </div>
                )}
                
                {isLoadingProjects ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-50">
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Loading Workspace...</span>
                  </div>
                ) : projects.length === 0 && !isAddingProject ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-zinc-800/50 rounded-xl bg-zinc-900/20">
                    <span className="text-zinc-600 text-xs italic mb-2">Workspace Empty</span>
                    <button 
                      onClick={() => setIsAddingProject(true)}
                      className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 uppercase tracking-widest underline decoration-cyan-500/30 underline-offset-4"
                    >
                      Initialize first project
                    </button>
                  </div>
                ) : (
                  projects.map(project => (
                    <div 
                      key={project}
                      onClick={() => setActiveProject(project)}
                      className={`flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border text-sm cursor-pointer transition-all ${
                        activeProject === project 
                          ? 'border-cyan-500/30 bg-cyan-500/5' 
                          : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className={`flex items-center gap-3 ${activeProject === project ? 'text-zinc-300 font-medium' : 'text-zinc-400'}`}>
                        <Folder className={`w-4 h-4 ${activeProject === project ? 'text-cyan-500/80' : 'text-zinc-600'}`} />
                        <span>{project}</span>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        activeProject === project 
                          ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' 
                          : 'bg-zinc-600'
                      }`} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Deployments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Deployments</p>
                {activeProject && (
                  <button 
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="px-2 py-1 text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                  >
                    {isDeploying ? 'Deploying...' : 'Deploy Now'}
                  </button>
                )}
              </div>
              <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/50 p-2 space-y-1 min-h-16">
                {deployments.length === 0 ? (
                  <div className="flex items-center justify-center h-full py-4">
                    <span className="text-zinc-600 text-xs italic">No active deployments</span>
                  </div>
                ) : (
                  deployments.map((deployment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span>{deployment.name}</span>
                      </div>
                      <span className="text-zinc-500 font-mono text-[10px]">
                        {deployment.time === 0 ? 'just now' : `${deployment.time} min${deployment.time > 1 ? 's' : ''} ago`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Project State */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Project State</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {['Thinking', 'Planning', 'Coding', 'Monitoring'].map(stage => {
                  const isActive = activeStage === stage;
                  return (
                    <div 
                      key={stage}
                      onClick={() => setActiveStage(stage)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                        isActive 
                          ? 'text-cyan-400 bg-cyan-500/5 border-cyan-500/20' 
                          : 'text-zinc-400 border-transparent hover:border-zinc-800'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        isActive 
                          ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                          : 'border-2 border-zinc-600'
                      }`} />
                      <span className={isActive ? "font-semibold" : ""}>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Column 2: Center (Voice / Stages) */}
      <div className="lg:col-span-4 bg-[#0d0d0f] border border-zinc-800 rounded-2xl flex flex-col min-h-0 relative overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30 z-10">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">Stage 1: Active Voice Session</h2>
          <div className="flex gap-2">
            <button 
              className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 transition-colors"
              title="Voice Session Activity"
              aria-label="Voice Session Activity"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 relative overflow-y-auto z-10">
          <VoiceInterface />
        </div>
      </div>

      {/* Column 3: Right (IDE / File Explorer / Terminal) */}
      <div className="lg:col-span-5 bg-[#0d0d0f] border border-zinc-800 rounded-2xl flex flex-col min-h-0">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">Current Project</h2>
        </div>
        <div className="flex-1 min-h-0 p-4">
          <IDE />
        </div>
      </div>

    </div>
  );
}
