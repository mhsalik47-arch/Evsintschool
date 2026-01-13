
import React, { useRef } from 'react';
import { useApp } from '../store';
import { translations } from '../translations';
import { Trash2, Languages, School, List, Save, Camera, X } from 'lucide-react';
import { ExpenseCategory } from '../types';

const SettingsComponent: React.FC = () => {
  const { settings, setSettings, setIncomes, setExpenses, setLabours, setAttendance, setPayments } = useApp();
  const t = translations[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (window.confirm("सावधानी: यह सारा डेटा हमेशा के लिए हटा देगा। क्या आप वाकई ऐसा करना चाहते हैं?")) {
      setIncomes([]); setExpenses([]); setLabours([]); setAttendance([]); setPayments([]);
      localStorage.clear(); window.location.reload();
    }
  };

  const handleLangToggle = () => {
    setSettings({ ...settings, language: settings.language === 'en' ? 'hi' : 'en' });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setSettings({ ...settings, logo: undefined });
  };

  const updateCategoryBudget = (cat: ExpenseCategory, valStr: string) => {
    let numericVal = Number(valStr);
    if (isNaN(numericVal)) numericVal = 0;
    
    const newCategoryBudgets = { ...settings.categoryBudgets, [cat]: numericVal };
    // Explicitly type sum as number to prevent unknown type error
    const newTotal = Object.values(newCategoryBudgets).reduce((sum: number, v) => sum + (v as number), 0);
    setSettings({ ...settings, categoryBudgets: newCategoryBudgets, estimatedBudget: newTotal });
  };

  const categories: ExpenseCategory[] = ['Masonry', 'Plumbing', 'Paint', 'Furniture', 'Electric', 'Material', 'Transport', 'Food', 'Other'];

  return (
    <div className="space-y-6 pb-10">
      {/* School Branding & Logo */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800">
            <School className="text-blue-600" size={24} />
            School Branding
        </h3>
        
        <div className="flex flex-col items-center mb-8">
            <div className="relative group">
                <div className="w-32 h-32 rounded-[40px] bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center group-hover:bg-slate-200 transition-all">
                    {settings.logo ? (
                        <img src={settings.logo} alt="School Logo" className="w-full h-full object-cover" />
                    ) : (
                        <School size={48} className="text-slate-300" />
                    )}
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-12 h-12 primary-bg text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white active:scale-95 transition-transform"
                >
                    <Camera size={20} />
                </button>
                {settings.logo && (
                    <button 
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.2em]">Upload School Logo</p>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                className="hidden" 
                accept="image/*" 
            />
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">{t.appTitle}</label>
            <input
              type="text"
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-4 outline-none focus:ring-4 focus:ring-blue-100 font-black text-slate-800"
              placeholder="e.g. EVS International"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">{t.location}</label>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-4 outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-600"
              placeholder="e.g. Noida, UP"
            />
          </div>
        </div>
      </div>

      {/* Budget Configuration */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
                <List className="text-blue-600" size={24} />
                Set Budgets
            </h3>
            <div className="bg-blue-50 px-4 py-2 rounded-2xl">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Total Budget</p>
                <p className="text-lg font-black text-blue-700">₹{(settings.estimatedBudget || 0).toLocaleString()}</p>
            </div>
        </div>
        
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat} className="group bg-slate-50/50 p-4 rounded-[24px] border border-slate-50 hover:border-blue-100 transition-all">
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wide">{(t as any).categories[cat]}</label>
                <div className="relative flex-1 max-w-[150px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                        type="number"
                        value={settings.categoryBudgets?.[cat] === 0 ? '' : settings.categoryBudgets?.[cat]}
                        onChange={(e) => updateCategoryBudget(cat, e.target.value)}
                        onBlur={(e) => { if(e.target.value === '') updateCategoryBudget(cat, '0') }}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3 pl-7 outline-none focus:ring-4 focus:ring-blue-100 font-black text-slate-800 text-sm shadow-sm"
                        placeholder="0"
                    />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-6 bg-slate-900 rounded-[32px] text-white">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Save size={24} className="text-blue-400" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Overall Project Cap</p>
                    <p className="text-2xl font-black">₹{(settings.estimatedBudget || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="bg-white rounded-[40px] p-4 shadow-sm border border-slate-100 space-y-2">
        <button onClick={handleLangToggle} className="w-full flex items-center justify-between p-5 rounded-[28px] hover:bg-slate-50 transition-all active:scale-95">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[20px] bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><Languages size={24} /></div>
            <div className="text-left">
                <p className="font-black text-slate-800 text-base">{t.language}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{settings.language === 'en' ? 'English' : 'हिंदी (Hindi)'}</p>
            </div>
          </div>
        </button>
        <button onClick={handleReset} className="w-full flex items-center justify-between p-5 rounded-[28px] hover:bg-red-50 transition-all active:scale-95 group">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[20px] bg-red-50 flex items-center justify-center text-red-600 shadow-sm"><Trash2 size={24} /></div>
            <div className="text-left">
                <p className="font-black text-slate-800 group-hover:text-red-600 transition-colors text-base">{t.resetData}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Wipe everything clean</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SettingsComponent;
