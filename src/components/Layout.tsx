import React from 'react';
import { motion } from 'motion/react';
import { Home, FolderClosed, List, Settings, LogOut, Folder, HelpCircle, Bell, User as UserIcon, Mic, MicOff } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: any;
}

export default function Layout({ children, activeTab, setActiveTab, onLogout, user }: LayoutProps) {
  const { isListening, isVoiceEnabled, status } = useProject();
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'ide', icon: FolderClosed, label: 'Workspace' },
    { id: 'voice', icon: List, label: 'Tasks' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-zinc-300 font-sans selection:bg-cyan-500/30">
      {/* Thin Left Sidebar */}
      <aside className="w-16 border-r border-zinc-800/50 flex flex-col bg-[#0d0d0f] items-center py-4">
        <nav className="flex-1 flex flex-col gap-4 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative",
                activeTab === item.id 
                  ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]" 
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                activeTab === item.id ? "text-emerald-400" : "text-zinc-500"
              )} />
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <button 
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-800/50 hover:text-red-400 transition-all"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-6 bg-[#0a0a0c] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              A.R.V.I.S. <span className="text-zinc-500 font-light hidden sm:inline">CONSOLE</span>
            </h1>
            <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                user?.uid === 'guest-user' ? "bg-amber-400" : "bg-emerald-400"
              )} />
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                user?.uid === 'guest-user' ? "text-amber-400" : "text-emerald-400"
              )}>
                {user?.uid === 'guest-user' ? "Guest Sandbox" : "Active Session"}
              </span>
            </div>

            <div className={cn(
              "hidden md:flex items-center gap-2 px-3 py-1 border rounded-full transition-all duration-300",
              !isVoiceEnabled ? "bg-zinc-900 border-zinc-800 opacity-60" : 
              isListening ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : 
              "bg-amber-500/5 border-amber-500/20"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                !isVoiceEnabled ? "bg-zinc-600" :
                isListening ? "bg-cyan-400 animate-pulse" : "bg-amber-500"
              )} />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-[0.1em]",
                !isVoiceEnabled ? "text-zinc-600" :
                isListening ? "text-cyan-400" : "text-amber-500"
              )}>
                {!isVoiceEnabled ? "Voice: Offline" :
                 isListening ? "Voice: Active" : "Voice: Standby"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-zinc-500">
            <button className="hover:text-zinc-300 transition-colors" title="Files"><Folder className="w-5 h-5" /></button>
            <button className="hover:text-zinc-300 transition-colors" title="Help"><HelpCircle className="w-5 h-5" /></button>
            <button className="hover:text-zinc-300 transition-colors" title="Notifications"><Bell className="w-5 h-5" /></button>
            <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:border-zinc-500 transition-all" title="User Profile">
              <UserIcon className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#0a0a0c]">
          {children}
        </div>
      </main>
    </div>
  );
}
