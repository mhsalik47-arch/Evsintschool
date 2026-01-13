
import React, { useState } from 'react';
import { AppProvider, useApp } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Finance from './components/Finance';
import Labour from './components/Labour';
import Settings from './components/Settings';
import Login from './components/Login';

const AppContent: React.FC = () => {
  const { auth } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!auth.isLoggedIn) {
    return <Login />;
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard />;
        case 'finance':
          return <Finance />;
        case 'labour':
          return <Labour />;
        case 'settings':
          return <Settings />;
        default:
          return <Dashboard />;
      }
    } catch (err) {
      console.error("Render Error:", err);
      return <div className="p-10 text-center font-bold text-red-500">Something went wrong. Please reload the app.</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>
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
