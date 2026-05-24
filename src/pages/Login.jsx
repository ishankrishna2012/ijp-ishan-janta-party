import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, signInOperative, resetPasswordOperative } = useAuth();
  const navigate = useNavigate();

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/student-hub');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !password) return;

    setIsAuthenticating(true);
    setAuthError(null);

    const result = await signInOperative({ loginIdentifier, password });

    if (result.success) {
      // Redirect handled by useEffect above
    } else {
      setAuthError(result.error);
      setIsAuthenticating(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginIdentifier.includes('@')) {
      setAuthError('Must provide a valid email address for password reset.');
      return;
    }
    setIsAuthenticating(true);
    setAuthError(null);
    setResetMsg(null);
    const result = await resetPasswordOperative(loginIdentifier);
    setIsAuthenticating(false);
    if (result.success) {
      setResetMsg('Reset link deployed to secure inbox.');
    } else {
      setAuthError(result.error);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col relative overflow-hidden font-body-md text-body-md selection:bg-primary selection:text-on-primary">
      {/* Ambient Texture & Scanlines */}
      <div className="absolute inset-0 scanline-bg pointer-events-none z-0 opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)] pointer-events-none z-0"></div>
      
      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop relative z-10">
        <div className="w-full max-w-md relative">
          
          {/* Dossier Tab */}
          <div className="absolute -top-10 left-4 bg-surface-container-lowest border-2 border-b-0 border-on-surface px-6 py-2 shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] rounded-t-none z-0">
            <span className="font-mono-style text-mono-style uppercase text-on-surface tracking-widest">FORM-84-B</span>
          </div>

          {/* Main Panel */}
          <div className="bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative z-10 rounded-none">
            
            {/* Serial Number */}
            <div className="absolute top-4 right-4 text-right">
              <span className="font-mono-style text-mono-style text-tertiary uppercase block">AUTH. LEVEL 9</span>
              <span className="font-mono-style text-mono-style text-primary uppercase block animate-pulse">
                {isAuthenticating ? 'SYNCHRONIZING...' : 'CONNECTION SECURE'}
              </span>
            </div>

            {/* Header */}
            <div className="mb-10 mt-6 border-b-2 border-on-surface pb-6">
              <div className="flex items-center gap-2 mb-2 text-on-surface">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                <span className="font-mono-style text-mono-style uppercase tracking-widest">IJP Directorate Hub</span>
              </div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase leading-none">
                Secure<br/>Uplink
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Error Box */}
              {authError && (
                <div className="border-2 border-error bg-error-container p-4 bureaucratic-shadow relative">
                  <div className="flex items-center gap-2 mb-1 text-on-error-container font-label-bold text-label-bold uppercase">
                    <span className="material-symbols-outlined text-error">gavel</span>
                    ACCESS DENIED
                  </div>
                  <p className="font-mono-style text-xs text-on-error-container">{authError}</p>
                </div>
              )}

              {/* Reset Success Box */}
              {resetMsg && (
                <div className="border-2 border-secondary bg-secondary-container p-4 bureaucratic-shadow relative">
                  <div className="flex items-center gap-2 mb-1 text-on-secondary-container font-label-bold text-label-bold uppercase">
                    <span className="material-symbols-outlined text-secondary">mark_email_read</span>
                    DISPATCH CONFIRMED
                  </div>
                  <p className="font-mono-style text-xs text-on-secondary-container">{resetMsg}</p>
                </div>
              )}

              {/* Input: Operative ID */}
              <div className="space-y-2 relative">
                <label className="block font-label-bold text-label-bold uppercase text-on-surface" htmlFor="operative_id">
                  Operative ID or Email
                </label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface border-2 border-on-surface p-4 font-mono-style text-mono-style text-on-surface placeholder-tertiary-fixed-dim outline-none focus:border-secondary focus:ring-0 rounded-none transition-colors" 
                    id="operative_id" 
                    name="operative_id" 
                    placeholder="IJP-YYYY-XXXX OR EMAIL" 
                    required 
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    disabled={isAuthenticating}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-tertiary-fixed-dim">badge</span>
                </div>
              </div>

              {/* Input: Authorization Key */}
              {!showForgot && (
                <div className="space-y-2 relative">
                  <label className="block font-label-bold text-label-bold uppercase text-on-surface" htmlFor="auth_key">
                    Authorization Key (Password)
                  </label>
                  <div className="relative">
                    <input 
                      className="w-full bg-surface border-2 border-on-surface p-4 font-mono-style text-mono-style text-on-surface placeholder-tertiary-fixed-dim outline-none focus:border-secondary focus:ring-0 rounded-none transition-colors" 
                      id="auth_key" 
                      name="auth_key" 
                      placeholder="••••••••••••" 
                      required 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isAuthenticating}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-tertiary-fixed-dim">key</span>
                  </div>
                </div>
              )}

              {/* Action Area */}
              <div className="pt-6">
                {!showForgot ? (
                  <button 
                    className="w-full bg-primary text-on-primary border-2 border-on-surface py-5 px-6 font-label-bold text-label-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed" 
                    type="submit"
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? 'AUTHENTICATING...' : 'Authenticate'}
                    <span className="material-symbols-outlined">login</span>
                  </button>
                ) : (
                  <button 
                    className="w-full bg-secondary text-on-secondary border-2 border-on-surface py-5 px-6 font-label-bold text-label-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed" 
                    type="button"
                    onClick={handleReset}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? 'TRANSMITTING...' : 'Deploy Reset Link'}
                    <span className="material-symbols-outlined">lock_reset</span>
                  </button>
                )}
              </div>

              {/* Auxiliary Links */}
              <div className="text-center pt-4 flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={() => { setShowForgot(!showForgot); setAuthError(null); setResetMsg(null); }}
                  className="inline-block font-mono-style text-mono-style text-on-surface-variant hover:text-primary uppercase border-b border-transparent hover:border-primary transition-colors"
                >
                  {showForgot ? 'RETURN TO UPLINK' : 'CLEARANCE CODE COMPROMISED? (FORGOT)'}
                </button>
                <Link 
                  to="/signup" 
                  className="inline-block font-mono-style text-mono-style text-on-surface-variant hover:text-secondary uppercase border-b border-transparent hover:border-secondary transition-colors"
                >
                  NEW RECRUIT? SUBMIT DOSSIER TO ENLIST
                </Link>
                <Link 
                  to="/" 
                  className="inline-block font-mono-style text-mono-style text-on-surface-variant hover:text-error uppercase border-b border-transparent hover:border-error transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </form>

            {/* Stamp Decoration */}
            <div className="absolute -bottom-6 -right-6 transform rotate-[-15deg] opacity-80 pointer-events-none">
              <div className="border-4 border-error text-error p-2 rounded-none bg-surface-container-lowest">
                <span className="font-headline-lg-mobile text-headline-lg-mobile uppercase block leading-none border-2 border-error p-2">CLASSIFIED</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <div className="w-full bg-on-surface border-t-2 border-on-surface h-12 flex items-center relative z-20 overflow-hidden">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 border-r-2 border-surface h-full bg-primary text-on-primary">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>radar</span>
          <span className="font-mono-style text-mono-style uppercase font-bold tracking-widest">SYSTEM STATUS</span>
        </div>
        <div className="flex-grow h-full bg-surface-container-highest relative">
          <div className="absolute top-0 left-0 h-full bg-secondary progress-bar-anim"></div>
          <div className="absolute inset-0 flex items-center px-4 mix-blend-difference text-on-primary">
            <span className="font-mono-style text-mono-style uppercase tracking-[0.2em] animate-pulse">
              {isAuthenticating ? 'Establishing satellite link...' : 'Scanning for dissent...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
