
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
  isOnline: boolean; isSyncing: boolean; triggerSync: (isPush?: boolean) => Promise<void>; saveSupabaseConfig: any;
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
    if (!supabase) {
        console.error("Supabase config missing!");
        return;
    }
    if (!navigator.onLine) {
        console.warn("Offline: Cannot sync with database");
        return;
    }
    
    setIsSyncing(true);
    console.log(`Starting ${isPush ? 'PUSH' : 'PULL'} sync...`);

    try {
      if (isPush) {
        // Push local changes to Supabase individually to catch specific table errors
        const syncPromises = [
          supabase.from('incomes').upsert(incomes).then(res => ({ table: 'incomes', ...res })),
          supabase.from('expenses').upsert(expenses).then(res => ({ table: 'expenses', ...res })),
          supabase.from('labours').upsert(labours).then(res => ({ table: 'labours', ...res })),
          supabase.from('attendance').upsert(attendance).then(res => ({ table: 'attendance', ...res })),
          supabase.from('payments').upsert(payments).then(res => ({ table: 'payments', ...res })),
          supabase.from('settings').upsert([{ id: 'global', ...settings }]).then(res => ({ table: 'settings', ...res }))
        ];

        const results = await Promise.all(syncPromises);
        
        results.forEach(res => {
          if (res.error) {
            console.error(`Sync Error in table [${res.table}]:`, res.error.message, res.error.details);
          } else {
            console.log(`Sync Success for table [${res.table}]`);
          }
        });

      } else {
        // Pull latest from Supabase
        const [inc, exp, lab, att, pay, set] = await Promise.all([
          supabase.from('incomes').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('labours').select('*'),
          supabase.from('attendance').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('settings').select('*').eq('id', 'global').single()
        ]);

        if (inc.data) setIncomes(inc.data);
        if (exp.data) setExpenses(exp.data);
        if (lab.data) setLabours(lab.data);
        if (att.data) setAttendance(att.data);
        if (pay.data) setPayments(pay.data);
        if (set.data) {
            const { id, ...cleanSettings } = set.data;
            setSettings(cleanSettings);
        }
        console.log("Pull sync completed successfully");
      }

      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('ss_lastSyncTime', now);
    } catch (error) {
      console.error("Global Sync Error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ss_incomes', JSON.stringify(incomes));
    localStorage.setItem('ss_expenses', JSON.stringify(expenses));
    localStorage.setItem('ss_labours', JSON.stringify(labours));
    localStorage.setItem('ss_attendance', JSON.stringify(attendance));
    localStorage.setItem('ss_payments', JSON.stringify(payments));
    localStorage.setItem('ss_settings', JSON.stringify(settings));
    localStorage.setItem('ss_auth', JSON.stringify(auth));
  }, [incomes, expenses, labours, attendance, payments, settings, auth]);

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


