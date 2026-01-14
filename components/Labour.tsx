
import React, { useState } from 'react';
import { useApp } from '../store';
import { translations } from '../translations';
import { UserPlus, Calendar, Check, X, Clock, Wallet, Search } from 'lucide-react';
import { Labour, Attendance, AttendanceStatus, LabourPayment } from '../types';

const LabourComponent: React.FC = () => {
  const { labours, setLabours, attendance, setAttendance, payments, setPayments, settings, triggerSync } = useApp();
  const t = translations[settings.language];
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'profiles' | 'payments'>('attendance');
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Form States
  const [payLabourId, setPayLabourId] = useState('');
  const [payAmount, setPayAmount] = useState('0');
  const [payType, setPayType] = useState<'Advance' | 'Full Payment'>('Advance');

  const handleSavePayment = () => {
    const amt = Number(payAmount);
    if (!payLabourId || !amt) return;
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

  const filteredLabours = labours.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
            {filteredLabours.map((l) => {
              const status = attendance.find(a => a.labourId === l.id && a.date === selectedDate)?.status;
              return (
                <div key={l.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{l.name}</h4>
                    <p className="text-[9px] text-blue-600 font-black uppercase">₹{l.dailyWage}/day</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleAttendance(l.id, 'Present')} className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'Present' ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-400'}`}><Check size={18} /></button>
                    <button onClick={() => toggleAttendance(l.id, 'Half-Day')} className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'Half-Day' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}><Clock size={18} /></button>
                    <button onClick={() => toggleAttendance(l.id, 'Absent')} className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'Absent' ? 'bg-red-600 text-white' : 'bg-slate-50 text-slate-400'}`}><X size={18} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <button onClick={() => setShowModal(true)} className="w-full primary-bg text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">
            <Wallet size={18} /> मजदूर को भुगतान दें (Add Payment)
          </button>
          <div className="space-y-3">
            {payments.map((p: any) => {
              const lab = labours.find(l => l.id === p.labourId);
              return (
                <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{lab?.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{p.date} • {p.type}</p>
                  </div>
                  <span className="text-sm font-black text-blue-700">₹{p.amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && activeSubTab === 'payments' && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-end sm:items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-6">भुगतान दर्ज करें</h3>
            <div className="space-y-4">
              <select value={payLabourId} onChange={(e) => setPayLabourId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none">
                <option value="">मजदूर चुनें</option>
                {labours.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-xl" placeholder="रकम" />
              <div className="flex gap-2">
                <button onClick={() => setPayType('Advance')} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${payType === 'Advance' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>ADVANCE</button>
                <button onClick={() => setPayType('Full Payment')} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${payType === 'Full Payment' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}>FULL PAYMENT</button>
              </div>
              <button onClick={handleSavePayment} className="w-full primary-bg text-white py-4 rounded-2xl font-black mt-4">सेव करें</button>
              <button onClick={() => setShowModal(false)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase">रद्द करें</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourComponent;
