
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store';
import { translations } from '../translations';
import { UserPlus, Calendar, Trash2, Check, X, Clock, Edit2, Search, HardHat as HatIcon } from 'lucide-react';
import { Labour, Attendance, AttendanceStatus, ExpenseCategory } from '../types';

const LabourComponent: React.FC = () => {
  const { labours, setLabours, attendance, setAttendance, settings, triggerSync } = useApp();
  const t = translations[settings.language];
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'attendance'>('attendance');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [labourName, setLabourName] = useState('');
  const [labourMobile, setLabourMobile] = useState('');
  const [labourCategory, setLabourCategory] = useState<ExpenseCategory>('Masonry');
  const [labourType, setLabourType] = useState('Mistry');
  const [dailyWage, setDailyWage] = useState('0');

  const categories: ExpenseCategory[] = ['Masonry', 'Plumbing', 'Paint', 'Furniture', 'Electric', 'Material', 'Transport', 'Other'];

  // Dynamic types logic
  const getTypesForCategory = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Masonry': return ['Mistry', 'Labour'];
      case 'Plumbing': return ['Plumber'];
      case 'Paint': return ['Painter'];
      case 'Electric': return ['Electrician'];
      case 'Furniture': return ['Karigar'];
      default: return ['Labour', 'Karigar', 'Other'];
    }
  };

  // Update labourType automatically when category changes
  useEffect(() => {
    const types = getTypesForCategory(labourCategory);
    if (!types.includes(labourType)) {
        setLabourType(types[0]);
    }
  }, [labourCategory]);

  const handleWageChange = (val: string) => {
    if (dailyWage === '0' && val.length > 1 && val.startsWith('0')) {
        setDailyWage(val.substring(1));
    } else if (val === '') {
        setDailyWage('0');
    } else {
        setDailyWage(val);
    }
  };

  const handleSaveLabour = () => {
    const numericWage = Number(dailyWage);
    if (!labourName || !numericWage) return;
    
    if (editingId) {
      setLabours(labours.map(l => l.id === editingId ? {
        ...l,
        name: labourName,
        mobile: labourMobile,
        type: labourType,
        category: labourCategory,
        dailyWage: numericWage
      } : l));
    } else {
      const newLabour: Labour = {
        id: Date.now().toString(),
        name: labourName,
        mobile: labourMobile,
        type: labourType,
        category: labourCategory,
        dailyWage: numericWage,
      };
      setLabours([...labours, newLabour]);
    }
    
    setTimeout(() => triggerSync(true), 500);
    resetLabourForm();
  };

  const resetLabourForm = () => {
    setLabourName('');
    setLabourMobile('');
    setDailyWage('0');
    setEditingId(null);
    setShowModal(false);
  };

  const startEdit = (l: Labour) => {
    setEditingId(l.id);
    setLabourName(l.name);
    setLabourMobile(l.mobile);
    setLabourCategory(l.category || 'Masonry');
    setLabourType(l.type);
    setDailyWage(l.dailyWage.toString());
    setShowModal(true);
  };

  const handleDeleteLabour = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      setLabours(labours.filter(l => l.id !== id));
      setAttendance(attendance.filter(a => a.labourId !== id));
      setTimeout(() => triggerSync(true), 500);
    }
  };

  const toggleAttendance = (labourId: string, status: AttendanceStatus) => {
    const existing = attendance.find(a => a.labourId === labourId && a.date === selectedDate);
    if (existing) {
      if (existing.status === status) {
        setAttendance(attendance.filter(a => a.id !== existing.id));
      } else {
        setAttendance(attendance.map(a => a.id === existing.id ? { ...a, status } : a));
      }
    } else {
      const newAtt: Attendance = {
        id: Date.now().toString(),
        labourId,
        date: selectedDate,
        status,
        overtimeHours: 0
      };
      setAttendance([...attendance, newAtt]);
    }
    setTimeout(() => triggerSync(true), 1000);
  };

  const getStatus = (labourId: string) => {
    return attendance.find(a => a.labourId === labourId && a.date === selectedDate)?.status;
  };

  const filteredLabours = useMemo(() => {
    return labours.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.mobile.includes(searchQuery) ||
      l.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.category && l.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [labours, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
        />
      </div>

      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'attendance' ? 'primary-bg text-white shadow-md' : 'text-slate-500'
          }`}
        >
          {t.attendance}
        </button>
        <button
          onClick={() => setActiveSubTab('profiles')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'profiles' ? 'primary-bg text-white shadow-md' : 'text-slate-500'
          }`}
        >
          Profiles
        </button>
      </div>

      {activeSubTab === 'attendance' ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-black text-slate-800 outline-none bg-transparent"
              />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {filteredLabours.length} List
            </span>
          </div>

          <div className="space-y-3">
            {filteredLabours.length > 0 ? filteredLabours.map((l) => {
              const status = getStatus(l.id);
              return (
                <div key={l.id} className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div>
                    <h4 className="font-black text-slate-800 text-base">{l.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{(t as any).labourTypes[l.type] || l.type}</p>
                       <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                       <p className="text-[9px] text-blue-600 font-black">₹{l.dailyWage}/day</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAttendance(l.id, 'Present')}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        status === 'Present' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-400 active:bg-slate-200'
                      }`}
                    >
                      <Check size={22} />
                    </button>
                    <button
                      onClick={() => toggleAttendance(l.id, 'Half-Day')}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        status === 'Half-Day' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-100 text-slate-400 active:bg-slate-200'
                      }`}
                    >
                      <Clock size={22} />
                    </button>
                    <button
                      onClick={() => toggleAttendance(l.id, 'Absent')}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        status === 'Absent' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-slate-100 text-slate-400 active:bg-slate-200'
                      }`}
                    >
                      <X size={22} />
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-slate-400">
                 <p className="text-sm font-bold">No labourers found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Labour Profiles</h2>
            <button
              onClick={() => { setEditingId(null); setShowModal(true); }}
              className="flex items-center gap-2 primary-bg text-white py-2.5 px-6 rounded-full text-sm font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95"
            >
              <UserPlus size={18} />
              {t.addLabour}
            </button>
          </div>

          <div className="grid gap-3">
            {filteredLabours.map((l) => (
              <div key={l.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[20px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <HatIcon size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base">{l.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{(t as any).labourTypes[l.type] || l.type} • {l.mobile || 'No Mobile'}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] font-black uppercase text-slate-400">Budget:</span>
                       <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">{(t as any).categories[l.category || 'Masonry']}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(l)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDeleteLabour(l.id)} className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-end sm:items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">{editingId ? t.editLabour : t.addLabour}</h3>
              <button onClick={resetLabourForm} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full">✕</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">{t.name}</label>
                <input
                  type="text"
                  value={labourName}
                  onChange={(e) => setLabourName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-4 text-base font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">{t.mobile}</label>
                <input
                  type="tel"
                  value={labourMobile}
                  onChange={(e) => setLabourMobile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-4 text-base font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="10-digit number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Labour Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-4 text-xs font-bold focus:ring-4 focus:ring-blue-100 outline-none"
                    value={labourCategory}
                    onChange={(e) => setLabourCategory(e.target.value as any)}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{(t as any).categories[cat]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Labour Type</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-4 text-xs font-bold focus:ring-4 focus:ring-blue-100 outline-none"
                    value={labourType}
                    onChange={(e) => setLabourType(e.target.value)}
                  >
                    {getTypesForCategory(labourCategory).map(type => (
                      <option key={type} value={type}>{(t as any).labourTypes[type] || type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">{t.wage}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={dailyWage === '0' ? '' : dailyWage}
                    onChange={(e) => handleWageChange(e.target.value)}
                    onFocus={() => { if(dailyWage === '0') setDailyWage(''); }}
                    onBlur={() => { if(dailyWage === '') setDailyWage('0'); }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-4 pl-8 text-base font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Enter Wage"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveLabour}
                className="w-full primary-bg text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-200 active:scale-95 transition-all mt-4"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourComponent;
