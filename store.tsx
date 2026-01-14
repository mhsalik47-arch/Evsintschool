
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Income, Expense, Labour, Attendance, LabourPayment, Settings } from './types';

const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('manual_supabase_url');
  const localKey = localStorage.getItem('manual_supabase_key');
  return { url: localUrl || '', key: localKey || '' };
};

const config = getSupabaseConfig();
const supabase = (config.url && config.key) ? createClient(config.url, config.key) : null;

interface AuthState {
  isLoggedIn: boolean;
  currentUser: string | null;
  role: string | null;
}

interface AppContextType {
  incomes: Income[]; expenses: Expense[]; labours: Labour[]; attendance: Attendance[]; payments: LabourPayment[];
  settings: Settings; auth: AuthState; supabaseConfig: { url: string; key: string };
  setIncomes: any; setExpenses: any; setLabours: any; setAttendance: any; setPayments: any; setSettings: any; setAuth: any;
  isOnline: boolean; isSyncing: boolean; triggerSync: (isPush?: boolean) => void; saveSupabaseConfig: any;
  lastSyncTime: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>(() => JSON.parse(localStorage.getItem('ss_incomes') || '[]'));
  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(localStorage.getItem('ss_expenses') || '[]'));
  const [labours, setLabours] = useState<Labour[]>(() => JSON.parse(localStorage.getItem('ss_labours') || '[]'));
  const [attendance, setAttendance] = useState<Attendance[]>(() => JSON.parse(localStorage.getItem('ss_attendance') || '[]'));
  const [payments, setPayments] = useState<LabourPayment[]>(() => JSON.parse(localStorage.getItem('ss_payments') || '[]'));
  const [settings, setSettings] = useState<Settings>(() => JSON.parse(localStorage.getItem('ss_settings') || '{"schoolName":"EVS School","language":"hi","categoryBudgets":{}}'));
  const [auth, setAuth] = useState<AuthState>(() => JSON.parse(localStorage.getItem('ss_auth') || '{"isLoggedIn":false}'));
  const [supabaseConfig] = useState(getSupabaseConfig);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('ss_lastSyncTime'));

  const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('manual_supabase_url', url);
    localStorage.setItem('manual_supabase_key', key);
    window.location.reload();
  };

  const triggerSync = async (isPush: boolean = false) => {
    if (!supabase || !navigator.onLine) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('ss_lastSyncTime', now);
    }, 1000);
  };

  useEffect(() => {
    localStorage.setItem('ss_incomes', JSON.stringify(incomes));
    localStorage.setItem('ss_expenses', JSON.stringify(expenses));
    localStorage.setItem('ss_labours', JSON.stringify(labours));
    localStorage.setItem('ss_attendance', JSON.stringify(attendance));
    localStorage.setItem('ss_settings', JSON.stringify(settings));
    localStorage.setItem('ss_auth', JSON.stringify(auth));
  }, [incomes, expenses, labours, attendance, settings, auth]);

  return (
    <AppContext.Provider value={{
      incomes, expenses, labours, attendance, payments, settings, auth, supabaseConfig,
      setIncomes, setExpenses, setLabours, setAttendance, setPayments, setSettings, setAuth,
      isOnline, isSyncing, triggerSync, saveSupabaseConfig, lastSyncTime
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
