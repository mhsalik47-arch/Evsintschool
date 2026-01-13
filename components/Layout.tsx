
import React from 'react';
import { LayoutDashboard, Wallet, Users, Settings as SettingsIcon, Wifi, WifiOff, School, LogOut, Cloud, RefreshCw } from 'lucide-react';
import { useApp } from '../store';
import { translations } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { settings, isOnline, setAuth, auth, isSyncing, triggerSync, lastSyncTime } = useApp();
  const t = translations[settings.language];

  const handleLogout = () => {
    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
      setAuth({ isLoggedIn: false, currentUser: null, role: null });
    }
  };

  const handleManualSync = () => {
    if (!isOnline) {
      alert("सिंक करने के लिए इंटरनेट चालू करें।");
      return;
    }
    triggerSync(false); // Pull updates
  };

  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'finance', label: t.income, icon: Wallet },
    { id: 'labour', label: t.labour, icon: Users },
    { id: 'settings', label: t.settings, icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="primary-bg text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10 p-0.5">
                <img src={settings.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                <School size={20} className="text-white" />
              </div>
            )}
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight">{settings.schoolName || t.appTitle}</h1>
                <div className="flex items-center gap-1 bg-green-500/20 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-green-300">
                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
                  Live
                </div>
              </div>
              <p className="text-[9px] opacity-90 font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px]">{auth.role}</span>
                {auth.currentUser}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleManualSync}
              className={`flex items-center gap-2 bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-full border border-white/10 transition-colors ${isSyncing ? 'animate-pulse' : ''}`}
            >
              {isSyncing ? (
                <RefreshCw size={10} className="text-blue-400 animate-spin" />
              ) : isOnline ? (
                <Cloud size={10} className="text-green-400" />
              ) : (
                <WifiOff size={10} className="text-amber-400" />
              )}
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] font-black uppercase tracking-tighter">
                  {isSyncing ? 'Syncing...' : isOnline ? 'In Sync' : 'Offline'}
                </span>
                {lastSyncTime && !isSyncing && (
                  <span className="text-[6px] opacity-50 font-bold">
                    {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center bg-red-500/20 text-red-100 rounded-xl border border-red-500/30 active:scale-90 transition-transform"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {isSyncing && (
           <div className="absolute bottom-0 left-0 h-0.5 bg-blue-400 animate-progress-fast w-full"></div>
        )}
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-2 z-40 shadow-[0_-4px_20px_0_rgba(0,0,0,0.03)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 w-16 ${
                isActive ? 'primary-text' : 'text-slate-400'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon size={22} className={isActive ? 'scale-110' : ''} />
              </div>
              <span className={`text-[9px] mt-1 font-black uppercase tracking-tighter ${isActive ? 'primary-text' : 'text-slate-400'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      
      <style>{`
        @keyframes progress-fast {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-fast {
          animation: progress-fast 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Layout;
