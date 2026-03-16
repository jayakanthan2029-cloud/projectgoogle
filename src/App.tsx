import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Console from './components/Console';
import IDE from './components/IDE';
import VoiceInterface from './components/VoiceInterface';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, User, syncUserToFirestore, logUserActivity, uploadActivityToGoogleDrive } from './firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { LogIn, Sparkles } from 'lucide-react';
import { ProjectProvider } from './context/ProjectContext';
import GlobalVoiceService from './components/GlobalVoiceService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Fallback: Show login screen after 3 seconds if Firebase is slow
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Firebase Auth taking too long, showing login screen fallback.");
        setLoading(false);
      }
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[Auth] Checking state...", user ? `User: ${user.email}` : "No user");
      clearTimeout(fallbackTimeout);
      try {
        if (user) {
          setUser(user);
          syncUserToFirestore(user).catch(err => console.warn("[Auth] Background sync failed:", err));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("[Auth] Error in callback:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const logActivity = async (type: string, details: string) => {
    if (!user) return;
    const payload = { type, details };
    try {
      await logUserActivity(user, payload);
      if (driveAccessToken) {
        await uploadActivityToGoogleDrive(driveAccessToken, payload);
      }
    } catch (error) {
      console.error('Activity sync error', error);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      console.log("[Auth] Starting Google Popup Flow...");
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      const signedInUser = result.user;
      console.log("[Auth] Success! User:", signedInUser.email);
      
      setUser(signedInUser);
      
      if (credential?.accessToken) {
        setDriveAccessToken(credential.accessToken);
      }
      
      // Sync tasks
      syncUserToFirestore(signedInUser).catch(e => console.error("[Auth] Sync failed", e));
    } catch (error: any) {
      console.error("[Auth] Login error:", error);
      setLoginError(error.message || "Sign-in failed. Please check your network or Firebase configuration.");
      setUser(null);
    }
  };

  const handleGuestLogin = () => {
    setUser({
      uid: 'guest-user',
      email: 'guest@arvis.local',
      displayName: 'Guest Agent',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
      emailVerified: true,
      isAnonymous: true,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({ token: '', claims: {}, authTime: '', issuedAtTime: '', expirationTime: '', signInProvider: null, signInSecondFactor: null }),
      reload: async () => {},
      toJSON: () => ({})
    } as any);
  };

  const handleLogout = async () => {
    try {
      if (user?.uid !== 'guest-user') {
        await auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setActiveTab('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
          <span className="text-cyan-500 font-bold tracking-widest animate-pulse">INITIALIZING A.R.V.I.S.</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d0d0f] border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />
          
          <div className="w-20 h-20 bg-linear-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <Sparkles className="w-10 h-10 text-white fill-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome to A.R.V.I.S.</h1>
          <p className="text-zinc-500 mb-10 leading-relaxed">
            Autonomous Real-time Voice Interface System. 
            Sign in to access your autonomous developer workspace.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl transition-all shadow-lg shadow-white/5 active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Google
            </button>
            <button 
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
            >
              Continue as Guest
            </button>
          </div>
          
          {loginError && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-500 font-mono tracking-tight wrap-break-word text-left">
                Error: {loginError}
              </p>
              <p className="text-[10px] text-red-400 mt-2 text-left opacity-80">
                (Note: Ensure Google Sign-In is enabled in your Firebase Console and the authorized domains are configured.)
              </p>
            </div>
          )}
          
          <p className="mt-8 text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
            Secure Access Protocol Enabled
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ProjectProvider>
        <GlobalVoiceService />
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} user={user}>
          {activeTab === 'dashboard' && <Console onActivity={logActivity} />}
          {activeTab === 'ide' && <IDE />}
          {activeTab === 'voice' && <VoiceInterface />}
          {activeTab === 'settings' && <Settings user={user} onGoogleLogin={handleLogin} />}
          {activeTab === 'terminal' && (
            <div className="h-full bg-black rounded-3xl p-8 border border-zinc-800 font-mono text-sm text-emerald-500">
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-xs font-bold uppercase tracking-widest">Main Terminal</span>
              </div>
              <p className="mb-2">A.R.V.I.S. OS v4.2.0 (tty1)</p>
              <p className="mb-2">Last login: {new Date().toLocaleString()}</p>
              <p className="mb-4">Type 'help' for a list of available commands.</p>
              <div className="flex gap-2">
                <span className="text-cyan-500">jayakanthan@arvis:~$</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          )}
        </Layout>
      </ProjectProvider>
    </ErrorBoundary>
  );
}
