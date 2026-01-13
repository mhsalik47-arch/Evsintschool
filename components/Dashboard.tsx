
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useApp } from '../store';
import { translations } from '../translations';
import { TrendingUp, TrendingDown, Wallet, HardHat, Users, AlertCircle, Clock, ArrowUpRight, ArrowDownLeft, Coffee } from 'lucide-react';
import { ExpenseCategory } from '../types';

const Dashboard: React.FC = () => {
  const { incomes, expenses, settings, attendance, labours, auth } = useApp();
  const t = translations[settings.language];

  // Calculate labour costs grouped by category
  const labourCostsByCategory = attendance.reduce((acc, att) => {
    const labour = labours.find(l => l.id === att.labourId);
    if (!labour) return acc;
    
    const cat = labour.category || 'Masonry';
    let dailyPay = 0;
    if (att.status === 'Present') dailyPay = labour.dailyWage;
    else if (att.status === 'Half-Day') dailyPay = labour.dailyWage / 2;
    const otPay = (labour.dailyWage / 8) * (att.overtimeHours || 0);
    const total = dailyPay + otPay;
    
    acc[cat] = (acc[cat] || 0) + total;
    return acc;
  }, {} as Record<string, number>);

  // Explicitly type sum as number to avoid unknown type errors
  const totalLabourCost = Object.values(labourCostsByCategory).reduce((sum: number, v: number) => sum + v, 0);
  const totalIncome = incomes.reduce((sum: number, item) => sum + item.amount, 0);
  const totalManualExpense = expenses.reduce((sum: number, item) => sum + item.amount, 0);
  const totalExpense = totalManualExpense + totalLabourCost;
  const netBalance = totalIncome - totalExpense;
  
  const muzahirIncome = incomes.filter(i => i.paidBy === 'Master Muzahir').reduce((sum, i) => sum + i.amount, 0);
  const salikIncome = incomes.filter(i => i.paidBy === 'Dr. Salik').reduce((sum, i) => sum + i.amount, 0);
  const otherIncome = totalIncome - muzahirIncome - salikIncome;

  const partnerData = [
    { name: 'Muzahir', value: muzahirIncome, color: '#1e3a8a' },
    { name: 'Salik', value: salikIncome, color: '#0ea5e9' },
    { name: 'Other', value: otherIncome, color: '#cbd5e1' },
  ].filter(d => d.value > 0);

  const stats = [
    { id: 'income', label: t.totalIncome, value: totalIncome, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'expense', label: t.totalExpense, value: totalExpense, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'balance', label: t.netBalance, value: netBalance, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'labour', label: t.labourCost, value: totalLabourCost, icon: HardHat, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Combine recent activities
  const recentActivities = [
    ...incomes.map(i => ({ ...i, type: 'income' })),
    ...expenses.map(e => ({ ...e, type: 'expense' })),
    ...attendance.map(a => {
        const l = labours.find(lab => lab.id === a.labourId);
        return { ...a, type: 'attendance', name: l?.name };
    })
  ].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  const categories: ExpenseCategory[] = ['Masonry', 'Plumbing', 'Paint', 'Furniture', 'Electric', 'Material', 'Transport', 'Food', 'Other'];
  const totalBudget = settings.estimatedBudget || 0;
  const overallPercent = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  const getProgressBarColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${s.bg} p-4 rounded-3xl shadow-sm border border-white/50 flex flex-col items-center text-center transition-transform active:scale-95`}>
            <s.icon className={`${s.color} mb-2`} size={24} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-black ${s.id === 'balance' ? (netBalance >= 0 ? 'text-green-600' : 'text-red-600') : s.color}`}>
                ₹{s.value.toLocaleString()}
              </span>
              {s.id === 'balance' && (
                netBalance >= 0 ? 
                  <TrendingUp size={14} className="text-green-500" /> : 
                  <TrendingDown size={14} className="text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Clock size={18} className="text-blue-600" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivities.length > 0 ? recentActivities.map((act: any) => (
            <div key={act.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    act.type === 'income' ? 'bg-green-50 text-green-600' : 
                    act.type === 'expense' ? (act.category === 'Food' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600') : 
                    'bg-blue-50 text-blue-600'
                }`}>
                    {act.type === 'income' ? <ArrowDownLeft size={18} /> : 
                     act.type === 'expense' ? (act.category === 'Food' ? <Coffee size={18} /> : <ArrowUpRight size={18} />) : 
                     <HardHat size={18} />}
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black text-slate-800">
                        {act.type === 'attendance' ? `${act.name} marked ${act.status}` : `₹${act.amount?.toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {act.type === 'income' ? `${act.paidBy} added fund` : 
                         act.type === 'expense' ? (act.category === 'Food' ? `${act.itemDetail} bill` : `Spent on ${act.category}`) : 
                         'Daily Attendance'}
                    </p>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase">{act.date}</span>
            </div>
          )) : (
            <p className="text-center text-xs text-slate-400 py-4 font-bold">No recent activities found.</p>
          )}
        </div>
      </div>

      {/* Partner Share Chart */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Users size={18} className="text-blue-600" />
          {t.partnerShare}
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={partnerData}
                innerRadius={70}
                outerRadius={95}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {partnerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => `₹${value.toLocaleString()}`} 
              />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Progress Breakdown */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tighter">Budget Progress</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Spent vs Allocated</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black tracking-tighter ${overallPercent > 100 ? 'text-red-500' : 'primary-text'}`}>
              {overallPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Overall Bar */}
        <div className="w-full bg-slate-100 rounded-full h-5 mb-10 p-1 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${getProgressBarColor(overallPercent)}`}
            style={{ width: `${Math.min(overallPercent, 100)}%` }}
          ></div>
        </div>

        {/* Categorized List */}
        <div className="space-y-8">
          {categories.map((cat) => {
            const manualCatSpent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
            const labourCatSpent = labourCostsByCategory[cat] || 0;
            const catSpent = manualCatSpent + labourCatSpent;
            const catBudget = settings.categoryBudgets?.[cat] || 0;
            
            if (catBudget === 0 && catSpent === 0) return null;
            
            const percent = catBudget > 0 ? (catSpent / catBudget) * 100 : 0;
            const isOverBudget = percent > 100;

            return (
              <div key={cat} className="relative">
                <div className="flex justify-between items-center mb-2 px-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      {(t as any).categories[cat]}
                    </span>
                    {isOverBudget && (
                      <span className="text-[9px] text-red-500 font-black uppercase flex items-center gap-1">
                        <AlertCircle size={10} /> Over Budget by ₹{(catSpent - catBudget).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-black ${isOverBudget ? 'text-red-500' : 'text-slate-500'}`}>
                    {percent.toFixed(0)}%
                  </span>
                </div>
                
                <div className="w-full bg-slate-50 border border-slate-100 h-2.5 rounded-full overflow-hidden mb-1.5 shadow-sm">
                  <div 
                    className={`h-full transition-all duration-1000 ${getProgressBarColor(percent)}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                  <span>Spent: ₹{catSpent.toLocaleString()}</span>
                  <span>Budget: ₹{catBudget.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {totalBudget === 0 && (
          <div className="bg-blue-50 p-6 rounded-3xl mt-4 text-center">
            <p className="text-xs font-bold text-blue-800">No budget set. Go to Settings to define budgets for each category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
