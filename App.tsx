
import React, { useState } from 'react';
import { AppProvider, useApp } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Finance from './components/Finance';
import Labour from './components/Labour';
import Settings from './components/Settings';
import Login from './components/Login';
import { Database, Save } from 'lucide-react';

const SetupScreen: React.FC = () => {
  const { saveSupabaseConfig } = useApp();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[48px] p-10 shadow-2xl border border-slate-100">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
          <Database size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 text-center mb-2">डेटाबेस सेटअप</h2>
        <p className="text-center text-slate-500 text-sm font-bold mb-8">अपनी Supabase जानकारी यहाँ दर्ज करें।</p>
        <div className="space-y-6">
          <input 
            type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 font-bold outline-none"
            placeholder="Supabase URL"
          />
          <textarea 
            value={key} onChange={(e) => setKey(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 font-bold outline-none h-32"
            placeholder="Anon Key"
          />
          <button 
            onClick={() => saveSupabaseConfig(url, key)}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95"
          >
            <Save size={20} /> सेटअप सेव करें
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { auth, supabaseConfig } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!supabaseConfig.url || !supabaseConfig.key) {
    return <SetupScreen />;
  }

  if (!auth?.isLoggedIn) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'finance': return <Finance />;
      case 'labour': return <Labour />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
