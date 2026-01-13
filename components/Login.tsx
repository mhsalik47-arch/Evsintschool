
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { translations } from '../translations';
import { Phone, Lock, School, ArrowRight, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { settings, setAuth } = useApp();
  const t = translations[settings.language];
  
  const [step, setStep] = useState<'phone' | 'password' | 'create' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [identifiedUser, setIdentifiedUser] = useState<'Master Muzahir' | 'Dr. Salik' | null>(null);
  const [identifiedRole, setIdentifiedRole] = useState<string | null>(null);

  const PARTNERS = {
    '9720353137': { name: 'Master Muzahir', role: t.principal },
    '8954555074': { name: 'Dr. Salik', role: t.manager }
  };

  const checkPhone = () => {
    setError('');
    const userData = (PARTNERS as any)[phone];
    if (userData) {
      setIdentifiedUser(userData.name);
      setIdentifiedRole(userData.role);
      const savedPass = localStorage.getItem(`pass_${phone}`);
      if (savedPass) {
        setStep('password');
      } else {
        setStep('create');
      }
    } else {
      setError('यह मोबाइल नंबर अधिकृत नहीं है।');
    }
  };

  const handleLogin = () => {
    setError('');
    const savedPass = localStorage.getItem(`pass_${phone}`);
    if (password === savedPass) {
      setAuth({ isLoggedIn: true, currentUser: identifiedUser, role: identifiedRole });
    } else {
      setError('गलत पासवर्ड। कृपया दोबारा कोशिश करें।');
    }
  };

  const handleCreatePassword = () => {
    setError('');
    if (password.length < 4) {
      setError('पासवर्ड कम से कम 4 अंकों का होना चाहिए।');
      return;
    }
    if (password !== confirmPassword) {
      setError('दोनों पासवर्ड मैच नहीं कर रहे हैं।');
      return;
    }
    localStorage.setItem(`pass_${phone}`, password);
    setAuth({ isLoggedIn: true, currentUser: identifiedUser, role: identifiedRole });
  };

  const handleReset = () => {
    setError('');
    if (password.length < 4) {
      setError('नया पासवर्ड कम से कम 4 अंकों का होना चाहिए।');
      return;
    }
    if (password !== confirmPassword) {
      setError('पासवर्ड मैच नहीं कर रहे।');
      return;
    }
    localStorage.setItem(`pass_${phone}`, password);
    setStep('password');
    setPassword('');
    setConfirmPassword('');
    alert('पासवर्ड सफलतापूर्वक बदल गया है। अब लॉगिन करें।');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl shadow-blue-900/10 p-10 border border-slate-100 animate-in fade-in zoom-in duration-500">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-24 h-24 rounded-[32px] primary-bg flex items-center justify-center shadow-2xl shadow-blue-200 mb-6 overflow-hidden">
            {settings.logo ? (
              <img src={settings.logo} className="w-full h-full object-cover" />
            ) : (
              <School size={48} className="text-white" />
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">{settings.schoolName || 'शिक्षा सेतु'}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Partner Portal</p>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100 animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {step === 'phone' && (
            <>
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="97203XXXXX"
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 pl-14 font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all text-lg"
                  />
                </div>
              </div>
              <button 
                onClick={checkPhone}
                className="w-full primary-bg text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                Next <ArrowRight size={20} />
              </button>
            </>
          )}

          {step === 'password' && (
            <>
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-3xl mb-6 border border-blue-100">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{identifiedRole}</p>
                  <p className="text-sm font-black text-slate-800">{identifiedUser}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Enter Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 pl-14 font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all text-lg tracking-widest"
                  />
                </div>
              </div>
              <button 
                onClick={handleLogin}
                className="w-full primary-bg text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-200 active:scale-95 transition-all"
              >
                Login
              </button>
              <button 
                onClick={() => setStep('reset')}
                className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest py-2 hover:text-blue-600 transition-colors"
              >
                Forgot Password?
              </button>
            </>
          )}

          {(step === 'create' || step === 'reset') && (
            <>
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-3xl mb-6 border border-green-100">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-green-600 shadow-sm">
                  <KeyRound size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">
                    {step === 'create' ? 'Set New Security' : 'Reset Password'}
                  </p>
                  <p className="text-sm font-black text-slate-800">{identifiedUser} ({identifiedRole})</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">New Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all tracking-widest"
                    placeholder="••••"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all tracking-widest"
                    placeholder="••••"
                  />
                </div>
              </div>
              <button 
                onClick={step === 'create' ? handleCreatePassword : handleReset}
                className="w-full primary-bg text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-200 active:scale-95 transition-all"
              >
                {step === 'create' ? 'Create & Enter' : 'Update Password'}
              </button>
              <button 
                onClick={() => setStep('phone')}
                className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest py-2"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-10 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">
        Secured by EVS School Management System
      </p>
    </div>
  );
};

export default Login;
