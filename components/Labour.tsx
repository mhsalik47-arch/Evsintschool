
import React, { useState } from 'react';
import { useApp } from '../store';
import { translations } from '../translations';
import { UserPlus, Calendar, Check, X, Clock, Wallet, Search, Phone, Trash2, HardHat } from 'lucide-react';
import { Labour, Attendance, AttendanceStatus, LabourPayment, ExpenseCategory } from '../types';

const LabourComponent: React.FC = () => {
  const { labours, setLabours, attendance, setAttendance, payments, setPayments, settings, triggerSync } = useApp();
  const t = translations[settings.language];
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'profiles' | 'payments'>('attendance');
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Labour Form States
  const [labName, setLabName] = useState('');
  const [labMobile, setLabMobile] = useState('');
  const [labWage, setLabWage] = useState('');
  const [labType, setLabType] = useState('Mistry');
  const [labCategory, setLabCategory] = useState<ExpenseCategory>('Masonry');

  // Payment Form States
  const [payLabourId, setPayLabourId] = useState('');
  const [payAmount, setPayAmount] = useState('0');
  const [payType, setPayType] = useState<'Advance' | 'Full Payment'>('Advance');

  const handleAddLabour = () => {
    if (!labName.trim()) {
        alert("कृपया मजदूर का नाम लिखें।");
        return;
    }
    if (!labWage || Number(labWage) <= 0) {
        alert("कृपया सही दिहाड़ी (Wage) लिखें।");
        return;
    }

    const newLab: Labour = {
      id: Date.now().toString(),
      name: labName,
      mobile: labMobile,
      type: labType,
      category: labCategory,
      dailyWage: Number(labWage)
    };

    setLabours((prev: Labour[]) => [...prev, newLab]);
    
    // Sync to database
    setTimeout(() => {
        triggerSync(true);
    }, 500);

    resetLabourForm();
    alert("मजदूर सफलतापूर्वक जोड़ दिया गया है।");
  };

  const deleteLabour = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      setLabours(labours.filter(l => l.id !== id));
      setTimeout(() => triggerSync(true), 500);
    }
  };

  const resetLabourForm = () => {
    setLabName(''); setLabMobile(''); setLabWage(''); setLabCategory('Masonry'); setLabType('Mistry'); setShowModal(false);
  };

  const handleSavePayment = () => {
    const amt = Number(payAmount);
    if (!payLabourId) {
        alert("कृपया मजदूर चुनें।");
        return;
    }
    if (!amt || amt <= 0) {
        alert("कृपया सही रकम लिखें।");
        return;
    }

    const newPay: LabourPayment = {
      id: Date.now().toString(),
      labourId: payLabourId,
      date: selectedDate,
      amount: amt,
      type: payType,
      mode: 'Cash'
    };
    setPayments((prev: any) => [newPay, ...prev]);
    setTimeout(() => triggerSync(true), 500);
    setShowModal(false);
    setPayAmount('0');
    alert("भुगतान सुरक्षित कर लिया गया है।");
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
      const newAtt: Attendance = { id: Date.now().toString(), labourId, date: selectedDate, status, overtimeHours: 0 };
      setAttendance((prev: any) => [...prev, newAtt]);
    }
    setTimeout(() => triggerSync(true), 1000);
  };

  const filteredLabours = (labours || []).filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const categories: ExpenseCategory[] = ['Masonry', 'Plumbing', 'Paint', 'Furniture', 'Electric', 'Material', 'Transport', 'Food', 'Other'];
  const labourTypes = ['Mistry', 'Labour', 'Electrician', 'Plumber', 'Painter'];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none shadow-sm" />
      </div>

      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
        {['attendance', 'profiles', 'payments'].map((tab) => (
          <button key={tab} onClick={() => setActiveSubTab(tab as any)} 
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[11px] font-black uppercase transition-all ${activeSubTab === tab ? 'primary-bg text-white' : 'text-slate-400'}`}>
            {(t as any)[tab] || tab}
          </button>
        ))}
      </div>

      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-black text-slate-800 outline-none bg-transparent" />
            </div>
          </div>
          <div className="space-y-3">
            {filteredLabours.length > 0 ? filteredLabours.map((l) => {
              const status = attendance.find(a => a.labourId === l.id && a.date === selectedDate)?.status;
              return (
                <div key={l.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center justify-between transition-all">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{l.name}</h4>
                    <p className="text-[9px] text-blue-600 font-black uppercase">₹{l.dailyWage}/day • {l.type}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleAttendance(l.id, 'Present')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${status === 'Present' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}><Check size={18} /></button>
                    <button onClick={() => toggleAttendance(l.id, 'Half-Day')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${status === 'Half-Day' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}><Clock size={18} /></button>
                    <button onClick={() => toggleAttendance(l.id, 'Absent')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${status === 'Absent' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}><X size={18} /></button>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center bg-blue-50/50 rounded-[32px] p-12 border border-blue-50">
                <HardHat size={40} className="mx-auto text-blue-200 mb-4" />
                <p className="text-xs text-blue-900 font-black uppercase tracking-widest">कोई मजदूर नहीं मिला</p>
                <button onClick={() => setActiveSubTab('profiles')} className="mt-4 text-[10px] font-black primary-bg text-white px-6 py-2 rounded-full uppercase">Profiles में जोड़ें</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'profiles' && (
        <div className="space-y-4">
          <button onClick={() => setShowModal(true)} className="w-full primary-bg text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 active:scale-95 transition-all">
            <UserPlus size={18} /> नया मजदूर जोड़ें (Add New)
          </button>
          <div className="space-y-3 pb-10">
            {filteredLabours.map((l) => (
              <div key={l.id} className="bg-white p-5 rounded-[32px] border border-slate-50 shadow-sm flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <HardHat size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base">{l.name}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{l.type} • ₹{l.dailyWage}/day</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">{(t as any).categories[l.category]}</p>
                  </div>
                </div>
                <button onClick={() => deleteLabour(l.id)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <button onClick={() => setShowModal(true)} className="w-full primary-bg text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <Wallet size={18} /> भुगतान दर्ज करें (Add Payment)
          </button>
          <div className="space-y-3">
            {payments.map((p: any) => {
              const lab = labours.find(l => l.id === p.labourId);
              return (
                <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{lab?.name || 'Unknown Labour'}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{p.date} • {p.type}</p>
                  </div>
                  <span className="text-sm font-black text-blue-700">₹{p.amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-end sm:items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">
                {activeSubTab === 'profiles' ? 'नया मजदूर जोड़ें' : 'भुगतान दर्ज करें'}
                </h3>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">✕</button>
            </div>
            
            {activeSubTab === 'profiles' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">नाम (Name)</label>
                  <input type="text" value={labName} onChange={(e) => setLabName(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:ring-2 focus:ring-blue-100" placeholder="मजदूर का नाम" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">दिहाड़ी (Daily Wage)</label>
                  <input type="number" value={labWage} onChange={(e) => setLabWage(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-100" placeholder="₹ 0" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">काम की श्रेणी (Category)</label>
                  <select value={labCategory} onChange={(e) => setLabCategory(e.target.value as any)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none">
                    {categories.map(cat => <option key={cat} value={cat}>{(t as any).categories[cat]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">हुनर (Type)</label>
                  <select value={labType} onChange={(e) => setLabType(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none">
                    {labourTypes.map(lt => <option key={lt} value={lt}>{(t as any).labourTypes[lt] || lt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">मोबाइल (Mobile)</label>
                  <input type="tel" value={labMobile} onChange={(e) => setLabMobile(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none" placeholder="10 अंकों का नंबर" />
                </div>
                <button onClick={handleAddLabour} className="w-full primary-bg text-white py-4 rounded-2xl font-black mt-4 shadow-xl active:scale-95 transition-transform">मजदूर सुरक्षित करें</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">मजदूर चुनें</label>
                    <select value={payLabourId} onChange={(e) => setPayLabourId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none">
                    <option value="">-- चुनें --</option>
                    {labours.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">रकम (Amount)</label>
                    <input type="number" value={payAmount === '0' ? '' : payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-xl border border-slate-100 outline-none" placeholder="₹ 0" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPayType('Advance')} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${payType === 'Advance' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>ADVANCE</button>
                  <button onClick={() => setPayType('Full Payment')} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${payType === 'Full Payment' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>FULL PAYMENT</button>
                </div>
                <button onClick={handleSavePayment} className="w-full primary-bg text-white py-4 rounded-2xl font-black mt-4 shadow-xl active:scale-95 transition-transform">भुगतान सेव करें</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourComponent;


