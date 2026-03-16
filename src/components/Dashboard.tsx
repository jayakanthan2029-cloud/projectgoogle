import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, ExternalLink, Clock, Trash2, Rocket } from 'lucide-react';
import { db, auth, collection, query, where, onSnapshot, OperationType, handleFirestoreError } from '../firebase';
import { Project } from '../types';

export default function Dashboard({ onNewProject }: { onNewProject: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectList.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Workspace</h1>
          <p className="text-zinc-500 mt-1">Manage and deploy your autonomous projects.</p>
        </div>
        <button 
          onClick={onNewProject}
          className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-zinc-700" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">No projects yet</h3>
          <p className="text-zinc-500 mt-2 max-w-xs mx-auto">
            Ready to build something amazing? Start a new project or talk to A.R.V.I.S. to begin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-[#0d0d0f] border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                  <Rocket className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400" />
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  project.status === 'deployed' ? 'bg-emerald-500/10 text-emerald-400' :
                  project.status === 'building' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {project.status}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-zinc-500 text-sm line-clamp-2 mb-6">
                {project.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {project.deploymentUrl && (
                    <a 
                      href={project.deploymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
