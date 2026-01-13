
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Income, Expense, Labour, Attendance, LabourPayment, Settings } from './types';

// Browser process shim check
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

// 1. Check environment variables (Vercel Build)
// 2. Check localStorage (Manual Input Fallback)
const getSupabaseConfig = () => {
  const envUrl = (window as any).process?.env?.SUPABASE_URL;
  const envKey = (window as any).process?.env?.SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('manual_supabase_url');
  const localKey = localStorage.getItem('manual_supabase_key');
  
  return {
    url: envUrl || localUrl || '',
    key: envKey || localKey || ''
  };
};

const config = getSupabaseConfig();
const supabase = (config.url && config.key) ? createClient(config.url, config.key) : null;

interface AuthState {
  isLoggedIn: boolean;
  currentUser: 'Master Muzahir' | 'Dr. Salik' | null;
  role: string | null;
}

interface AppContextType {
  incomes: Income[];
  expenses: Expense[];
  labours: Labour[];
  attendance: Attendance[];
  payments: LabourPayment[];
  settings: Settings;
  auth: AuthState;
  supabaseConfig: { url: string, key: string };
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setLabours: React.Dispatch<React.SetStateAction<Labour[]>>;
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  setPayments: React.Dispatch<React.SetStateAction<LabourPayment[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  triggerSync: (forcePush?: boolean) => Promise<void>;
  saveSupabaseConfig: (url: string, key: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const safeParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed || fallback;
  } catch (e) {
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>(() => safeParse('ss_incomes', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => safeParse('ss_expenses', []));
  const [labours, setLabours] = useState<Labour[]>(() => safeParse('ss_labours', []));
  const [attendance, setAttendance] = useState<Attendance[]>(() => safeParse('ss_attendance', []));
  const [payments, setPayments] = useState<LabourPayment[]>(() => safeParse('ss_payments', []));
  const [settings, setSettings] = useState<Settings>(() => safeParse('ss_settings', {
    schoolName: 'EVS School',
    location: '',
    estimatedBudget: 0,
    categoryBudgets: {
      Masonry: 0, Plumbing: 0, Paint: 0, Furniture: 0, Electric: 0, Material: 0, Transport: 0, Food: 0, Other: 0
    },
    language: 'hi'
  }));
  
  const [auth, setAuth] = useState<AuthState>(() => safeParse('ss_auth', { isLoggedIn: false, currentUser: null, role: null }));
  const [supabaseConfig, setSupabaseConfigState] = useState(getSupabaseConfig);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('ss_last_sync'));

  const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('manual_supabase_url', url);
    localStorage.setItem('manual_supabase_key', key);
    window.location.reload(); // Reload to re-initialize Supabase client
  };

  const syncWithCloud = useCallback(async (action: 'push' | 'pull') => {
    if (!supabase || !navigator.onLine) {
        setIsOnline(navigator.onLine);
        return;
    }
    
    setIsSyncing(true);
    try {
      if (action === 'push') {
        await Promise.all([
          labours.length > 0 && supabase.from('labours').upsert(labours.map(l => ({
            id: l.id, name: l.name, mobile: l.mobile, worker_type: l.type, category: l.category, daily_wage: l.dailyWage
          }))),
          incomes.length > 0 && supabase.from('incomes').upsert(incomes.map(i => ({
            id: i.id, date: i.date, amount: i.amount, source: i.source, paid_by: i.paidBy, mode: i.mode, remarks: i.remarks
          }))),
          expenses.length > 0 && supabase.from('expenses').upsert(expenses.map(e => ({
            id: e.id, date: e.date, amount: e.amount, category: e.category, sub_category: e.subCategory, item_detail: e.itemDetail, paid_to: e.paidTo || 'Unknown', mode: e.mode, notes: e.notes
          }))),
          attendance.length > 0 && supabase.from('attendance').upsert(attendance.map(a => {
            const l = labours.find(lab => lab.id === a.labourId);
            return {
              id: a.id, labour_id: a.labourId, labour_name: l?.name || 'Unknown', date: a.date, status: a.status, overtime_hours: a.overtimeHours, daily_wage_at_time: l?.dailyWage || 0
            };
          })),
          payments.length > 0 && supabase.from('labour_payments').upsert(payments.map(p => {
             const l = labours.find(lab => lab.id === p.labourId);
             return {
                id: p.id, labour_id: p.labourId, labour_name: l?.name || 'Unknown', date: p.date, amount: p.amount, payment_type: p.type, mode: p.mode
             };
          })),
          supabase.from('settings').upsert({
            id: 'current', school_name: settings.schoolName, location: settings.location, logo: settings.logo, estimated_budget: settings.estimatedBudget, category_budgets: settings.categoryBudgets, language: settings.language
          })
        ]);
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('ss_last_sync', now);
      } else {
        const [ { data: lData }, { data: iData }, { data: eData }, { data: aData }, { data: pData }, { data: sData } ] = await Promise.all([
          supabase.from('labours').select('*'),
          supabase.from('incomes').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('attendance').select('*'),
          supabase.from('labour_payments').select('*'),
          supabase.from('settings').select('*').eq('id', 'current').maybeSingle()
        ]);

        if (lData) setLabours(lData.map(l => ({ id: l.id, name: l.name, mobile: l.mobile, type: l.worker_type, category: l.category, dailyWage: Number(l.daily_wage) })));
        if (iData) setIncomes(iData.map(i => ({ ...i, amount: Number(i.amount), paidBy: i.paid_by })));
        if (eData) setExpenses(eData.map(e => ({ ...e, amount: Number(e.amount), subCategory: e.sub_category, itemDetail: e.item_detail, paidTo: e.paid_to || 'Unknown' })));
        if (aData) setAttendance(aData.map(a => ({ id: a.id, labourId: a.labour_id, date: a.date, status: a.status, overtimeHours: Number(a.overtime_hours) })));
        if (pData) setPayments(pData.map(p => ({ id: p.id, labourId: p.labour_id, date: p.date, amount: Number(p.amount), type: p.payment_type, mode: p.mode })));
        if (sData) {
          setSettings({
            schoolName: sData.school_name || settings.schoolName,
            location: sData.location || settings.location,
            logo: sData.logo,
            estimatedBudget: Number(sData.estimated_budget || settings.estimatedBudget),
            categoryBudgets: sData.category_budgets || settings.categoryBudgets,
            language: (sData.language as any) || settings.language
          });
        }
      }
    } catch (e) {
      console.warn("Sync error (non-critical):", e);
    } finally {
      setIsSyncing(false);
    }
  }, [incomes, expenses, labours, attendance, payments, settings]);

  const triggerSync = async (forcePush = true) => {
    await syncWithCloud(forcePush ? 'push' : 'pull');
  };

  useEffect(() => {
    const interval = setInterval(() => syncWithCloud('pull'), 60000);
    return () => clearInterval(interval);
  }, [syncWithCloud]);

  useEffect(() => {
    syncWithCloud('pull');
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ss_incomes', JSON.stringify(incomes));
      localStorage.setItem('ss_expenses', JSON.stringify(expenses));
      localStorage.setItem('ss_labours', JSON.stringify(labours));
      localStorage.setItem('ss_attendance', JSON.stringify(attendance));
      localStorage.setItem('ss_payments', JSON.stringify(payments));
      localStorage.setItem('ss_settings', JSON.stringify(settings));
      localStorage.setItem('ss_auth', JSON.stringify(auth));
    } catch (e) {}
  }, [incomes, expenses, labours, attendance, payments, settings, auth]);

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

  return (
    <AppContext.Provider value={{
      incomes, expenses, labours, attendance, payments, settings, auth, supabaseConfig,
      setIncomes, setExpenses, setLabours, setAttendance, setPayments, setSettings, setAuth,
      isOnline, isSyncing, lastSyncTime, triggerSync, saveSupabaseConfig
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

