
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { translations } from '../translations';
import { Plus, Trash2, Search, ArrowUpRight, ArrowDownLeft, Coffee, Calendar } from 'lucide-react';
import { Income, Expense, PaymentMode, IncomeSource, Partner, ExpenseCategory, ExpenseSubCategory } from '../types';

const Finance: React.FC = () => {
  const { incomes, setIncomes, expenses, setExpenses, settings, triggerSync } = useApp();
  const t = translations[settings.language];
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'income' | 'expense' | 'food' | 'partners'>('history');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [amount, setAmount] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState<IncomeSource>('Investment');
  const [category, setCategory] = useState<ExpenseCategory>('Masonry');
  const [subCategory, setSubCategory] = useState<ExpenseSubCategory>('Vendor');
  const [itemDetail, setItemDetail] = useState('None');
  const [paidBy, setPaidBy] = useState<Partner>('Master Muzahir');
  const [paidTo, setPaidTo] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Cash');
  const [remarks, setRemarks] = useState('');

  const handleSave = async () => {
    const numAmt = Number(amount);
    if (!numAmt || isNaN(numAmt)) return;

    if (activeSubTab === 'income') {
      const newInc: Income = { id: Date.now().toString(), amount: numAmt, date, source, paidBy, mode, remarks };
      setIncomes((prev: any) => [newInc, ...prev]);
    } else {
      const newExp: Expense = {
        id: Date.now().toString(),
        amount: numAmt,
        date,
        category: activeSubTab === 'food' ? 'Food' : category,
        subCategory,
        itemDetail: itemDetail !== 'None' ? itemDetail : undefined,
        paidTo: paidTo || 'Vendor',
        mode,
        notes: remarks,
      };
      setExpenses((prev: any) => [newExp, ...prev]);
    }
    
    setTimeout(() => triggerSync(true), 500);
    resetForm();
  };

  const resetForm = () => {
    setAmount('0'); setDate(new Date().toISOString().split('T')[0]); setRemarks('');
    setPaidTo(''); setItemDetail('None'); setShowModal(false);
  };

  const categories: ExpenseCategory[] = ['Masonry', 'Plumbing', 'Paint', 'Furniture', 'Electric', 'Material', 'Transport', 'Food', 'Other'];
  const materialItems = ['Cement', 'Sand', 'Gravel', 'CrushedSand', 'Steel', 'Bricks', 'None'];
  const foodItems = ['Tea', 'Snacks', 'Lunch', 'Water', 'Other'];

  const groupedHistory = useMemo(() => {
    const all = [
      ...incomes.map(i => ({ ...i, type: 'income' as const })),
      ...expenses.map(e => ({ ...e, type: 'expense' as const }))
    ].sort((a, b) => b.date.localeCompare(a.date));
    
    const filtered = all.filter(item => {
      const q = searchQuery.toLowerCase();
      const text = (item.type === 'income' ? `${item.remarks} ${item.paidBy}` : `${item.notes} ${item.paidTo} ${item.category}`).toLowerCase();
      return text.includes(q);
    });

    const groups: Record<string, any[]> = {};
    filtered.forEach(item => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  }, [incomes, expenses, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none shadow-sm" />
      </div>

      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
        {['history', 'income', 'expense', 'food', 'partners'].map((tab) => (
          <button key={tab} onClick={() => setActiveSubTab(tab as any)} 
            className={`flex-1 min-w-[80px] py-3 rounded-xl text-[11px] font-black uppercase transition-all ${activeSubTab === tab ? 'primary-bg text-white' : 'text-slate-400'}`}>
            {(t as any)[tab] || tab}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center py-1">
        <h2 className="text-lg font-black text-slate-800">{(t as any)[activeSubTab]}</h2>
        {activeSubTab !== 'partners' && activeSubTab !== 'history' && (
          <button onClick={() => setShowModal(true)} className="primary-bg text-white py-2.5 px-6 rounded-full text-xs font-black shadow-lg flex items-center gap-2">
            <Plus size={16} /> {activeSubTab === 'income' ? t.addIncome : activeSubTab === 'food' ? t.addFood : t.addExpense}
          </button>
        )}
      </div>

      <div className="space-y-4 pb-10">
        {activeSubTab === 'history' && Object.entries(groupedHistory).map(([d, items]) => (
          <div key={d} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
              <div className="flex-1 h-[1px] bg-slate-100"></div>
            </div>
            {items.map((item: any) => (
              <div key={item.id} className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">₹{item.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                      {item.type === 'income' ? `${item.paidBy} • ${item.source}` : `${item.paidTo} • ${(t as any).categories[item.category]}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {/* Placeholder for other tabs logic... */}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-end sm:items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">नया डेटा जोड़ें</h3>
              <button onClick={resetForm} className="w-10 h-10 bg-slate-100 rounded-full">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">रकम (Amount)</label>
                <input type="number" value={amount === '0' ? '' : amount} onChange={(e) => setAmount(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xl font-black outline-none" placeholder="0" />
              </div>

              {activeSubTab === 'expense' && (
                <>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">श्रेणी (Category)</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none">
                      {categories.map(c => <option key={c} value={c}>{(t as any).categories[c]}</option>)}
                    </select>
                  </div>
                  {category === 'Material' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">सामान (Material Item)</label>
                      <select value={itemDetail} onChange={(e) => setItemDetail(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none">
                        {materialItems.map(m => <option key={m} value={m}>{(t as any).items[m] || m}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {activeSubTab === 'food' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">विवरण (Food Item)</label>
                  <select value={itemDetail} onChange={(e) => setItemDetail(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none">
                    {foodItems.map(f => <option key={f} value={f}>{(t as any).foodItems[f] || f}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">{activeSubTab === 'income' ? 'किसने दिया' : 'किसे दिया'}</label>
                {activeSubTab === 'income' ? (
                  <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as any)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none">
                    <option value="Master Muzahir">Master Muzahir</option><option value="Dr. Salik">Dr. Salik</option><option value="Other">Other</option>
                  </select>
                ) : (
                  <input type="text" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none" placeholder="वेंडर का नाम" />
                )}
              </div>

              <button onClick={handleSave} className="w-full primary-bg text-white font-black py-4 rounded-2xl shadow-xl mt-4">सेव करें (Save)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
