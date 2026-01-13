
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Income, Expense, Labour, Attendance, LabourPayment, Settings } from './types';

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>(() => JSON.parse(localStorage.getItem('ss_incomes') || '[]'));
  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(localStorage.getItem('ss_expenses') || '[]'));
  const [labours, setLabours] = useState<Labour[]>(() => JSON.parse(localStorage.getItem('ss_labours') || '[]'));
  const [attendance, setAttendance] = useState<Attendance[]>(() => JSON.parse(localStorage.getItem('ss_attendance') || '[]'));
  const [payments, setPayments] = useState<LabourPayment[]>(() => JSON.parse(localStorage.getItem('ss_payments') || '[]'));
  const [settings, setSettings] = useState<Settings>(() => JSON.parse(localStorage.getItem('ss_settings') || JSON.stringify({
    schoolName: 'EVS School',
    location: '',
    estimatedBudget: 0,
    categoryBudgets: {
      Masonry: 0, Plumbing: 0, Paint: 0, Furniture: 0, Electric: 0, Material: 0, Transport: 0, Food: 0, Other: 0
    },
    language: 'hi'
  })));
  
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('ss_auth');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, currentUser: null, role: null };
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('ss_last_sync'));

  // Multi-table Sync with Deep Detail
  const syncWithCloud = useCallback(async (action: 'push' | 'pull') => {
    if (!supabase || !navigator.onLine) {
        setIsOnline(navigator.onLine);
        return;
    }
    
    setIsSyncing(true);
    try {
      if (action === 'push') {
        // Push logic
        await Promise.all([
          labours.length > 0 && supabase.from('labours').upsert(labours.map(l => ({
            id: l.id, name: l.name, mobile: l.mobile, worker_type: l.type, category: l.category, daily_wage: l.dailyWage
          }))),
          incomes.length > 0 && supabase.from('incomes').upsert(incomes.map(i => ({
            id: i.id, date: i.date, amount: i.amount, source: i.source, paid_by: i.paidBy, mode: i.mode, remarks: i.remarks
          }))),
          expenses.length > 0 && supabase.from('expenses').upsert(expenses.map(e => ({
            id: e.id, date: e.date, amount: e.amount, category: e.category, sub_category: e.subCategory, item_detail: e.itemDetail, paid_to: e.paidTo, mode: e.mode, notes: e.notes
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
        setLastSyncTime(new Date().toISOString());
        localStorage.setItem('ss_last_sync', new Date().toISOString());
      } else {
        // Pull logic
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
        if (eData) setExpenses(eData.map(e => ({ ...e, amount: Number(e.amount), subCategory: e.sub_category, itemDetail: e.item_detail, paidTo: e.paid_to })));
        if (aData) setAttendance(aData.map(a => ({ id: a.id, labourId: a.labour_id, date: a.date, status: a.status, overtimeHours: Number(a.overtime_hours) })));
        if (pData) setPayments(pData.map(p => ({ id: p.id, labourId: p.labour_id, date: p.date, amount: Number(p.amount), type: p.payment_type, mode: p.mode })));
        if (sData) {
          setSettings({
            schoolName: sData.school_name,
            location: sData.location,
            logo: sData.logo,
            estimatedBudget: Number(sData.estimated_budget),
            categoryBudgets: sData.category_budgets,
            language: sData.language as any
          });
        }
      }
    } catch (e) {
      console.error("Critical Sync Error - UI maintained:", e);
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
    localStorage.setItem('ss_incomes', JSON.stringify(incomes));
    localStorage.setItem('ss_expenses', JSON.stringify(expenses));
    localStorage.setItem('ss_labours', JSON.stringify(labours));
    localStorage.setItem('ss_attendance', JSON.stringify(attendance));
    localStorage.setItem('ss_payments', JSON.stringify(payments));
    localStorage.setItem('ss_settings', JSON.stringify(settings));
    localStorage.setItem('ss_auth', JSON.stringify(auth));
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
      incomes, expenses, labours, attendance, payments, settings, auth,
      setIncomes, setExpenses, setLabours, setAttendance, setPayments, setSettings, setAuth,
      isOnline, isSyncing, lastSyncTime, triggerSync
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
