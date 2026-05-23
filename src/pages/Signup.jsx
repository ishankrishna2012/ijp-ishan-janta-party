import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { user, signUpOperative } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [codename, setCodename] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sector, setSector] = useState('');
  const [terms, setTerms] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successId, setSuccessId] = useState(null);
  
  // Biometrics mock states
  const [scanState, setScanState] = useState('IDLE'); // IDLE, SCANNING, SUCCESS
  const [scanProgress, setScanProgress] = useState(0);

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/student-hub');
    }
  }, [user, navigate]);

  // Biometrics Mock Scan Handler
  const handleBiometricScan = () => {
    if (scanState !== 'IDLE') return;
    
    setScanState('SCANNING');
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanState('SUCCESS');
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!codename || !email || !password || !sector) {
      setErrorMsg('Please complete all dossiers fields.');
      return;
    }
    if (scanState !== 'SUCCESS') {
      setErrorMsg('Biometric verification is mandatory for clearance protocol 7A.');
      return;
    }
    if (!terms) {
      setErrorMsg('You must surrender your morning sleep cycles and accept the terms.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await signUpOperative({ codename, email, password, sector });

    if (result.success) {
      setSuccessId(result.uniqueId);
    } else {
      setErrorMsg(result.error);
      setIsSubmitting(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (successId) {
      navigator.clipboard.writeText(successId);
      alert('Operative ID copied to clipboard! Proceed to authenticate.');
    }
  };

  return (
    <div className="min-h-screen text-on-surface font-body-md overflow-x-hidden relative flex flex-col items-center justify-center py-12 px-margin-mobile md:px-margin-desktop bg-[#e2e2e2]">
      <div className="scanlines absolute inset-0 z-50 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.05)_51%)] bg-[size:100%_4px]"></div>
      
      {/* Main Enlistment Dossier */}
      <main className="w-full max-w-[800px] relative z-10">
        
        {/* Tab / Header */}
        <div className="flex items-end mb-[-2px]">
          <div className="bg-surface-container-lowest border-2 border-b-0 border-on-surface px-6 py-2 rounded-t-sm z-20 relative">
            <span className="font-mono-style text-mono-style uppercase tracking-widest text-on-surface">FORM IJP-99</span>
          </div>
          <div className="flex-grow border-b-2 border-on-surface"></div>
          <div className="pb-2 pl-4">
            <span className="font-mono-style text-mono-style text-on-surface-variant">CLASSIFIED // LEVEL 1</span>
          </div>
        </div>

        {/* Document Body */}
        <div className="bg-surface-container-lowest border-2 border-on-surface p-8 md:p-12 bureaucratic-shadow relative">
          
          {/* Top Secret Redaction Bar Decoration */}
          <div className="absolute top-8 right-8 w-32 h-6 bg-on-surface flex items-center justify-center group cursor-help transition-all duration-300 hover:bg-transparent hover:border-2 hover:border-on-surface">
            <span className="font-mono-style text-mono-style text-surface-container-lowest group-hover:text-error transition-colors">TOP SECRET</span>
          </div>

          {successId ? (
            /* SUCCESS REGISTRATION PANEL */
            <div className="text-center py-8 space-y-8 animate-fadeIn">
              <div className="border-4 border-dashed border-secondary bg-secondary-container/20 p-8 bureaucratic-shadow relative">
                <span className="material-symbols-outlined text-[72px] text-secondary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <h2 className="font-headline-lg text-headline-lg uppercase text-secondary tracking-tight">ENLISTMENT APPROVED</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-md mx-auto">
                  Welcome to the cadre. Your operative dossier has been written to the database.
                </p>
                
                {/* ID Card Display */}
                <div className="mt-8 border-4 border-on-surface bg-surface p-6 max-w-sm mx-auto relative overflow-hidden text-left bureaucratic-shadow">
                  <div className="absolute top-0 right-0 bg-primary text-on-primary font-mono-style text-[10px] px-2 py-1 uppercase border-l-2 border-b-2 border-on-surface">OPERATIVE DOSSIER</div>
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                    <div>
                      <div className="font-mono-style text-[10px] text-tertiary">CODENAME</div>
                      <div className="font-label-bold text-base text-on-surface uppercase">{codename}</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t-2 border-on-surface border-dashed pt-4">
                    <div className="font-mono-style text-[10px] text-tertiary">UNIQUE ID (REQUIRED FOR LOGIN)</div>
                    <div className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary tracking-widest mt-1 flex items-center justify-between">
                      <span>{successId}</span>
                      <button 
                        onClick={handleCopyToClipboard}
                        className="material-symbols-outlined text-on-surface hover:text-primary transition-colors"
                        title="Copy to Clipboard"
                      >
                        content_copy
                      </button>
                    </div>
                  </div>
                </div>

                <p className="font-mono-style text-[11px] text-on-surface-variant mt-6 uppercase animate-pulse">
                  * Note down your 12-digit Unique ID. You will need it to Uplink.
                </p>
              </div>

              <div className="pt-4">
                <Link 
                  to="/login"
                  className="bg-primary text-on-primary font-headline-lg-mobile text-body-lg md:text-headline-lg-mobile uppercase px-12 py-5 border-2 border-on-surface bureaucratic-shadow bureaucratic-shadow-hover transition-all w-full sm:w-auto inline-block text-center"
                >
                  PROCEED TO UPLINK
                </Link>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <>
              {/* Headers */}
              <div className="mb-10 text-center border-b-2 border-on-surface pb-8">
                <span className="material-symbols-outlined text-7xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
                <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg uppercase tracking-tighter text-on-surface leading-none mb-2">OFFICIAL ENLISTMENT</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">MANDATORY REGISTRATION FOR ALL CADRE OPERATIVES.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignup} className="space-y-8">
                
                {/* Error Banner */}
                {errorMsg && (
                  <div className="border-2 border-error bg-error-container p-4 bureaucratic-shadow">
                    <div className="flex items-center gap-2 mb-1 text-on-error-container font-label-bold text-label-bold uppercase">
                      <span className="material-symbols-outlined text-error">warning</span>
                      DOSSIER INCOMPLETE
                    </div>
                    <p className="font-mono-style text-xs text-on-error-container">{errorMsg}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Codename */}
                  <div className="flex flex-col">
                    <label className="font-label-bold text-label-bold uppercase mb-2 text-on-surface" htmlFor="codename">CODENAME (USERNAME)</label>
                    <input 
                      className="border-2 border-on-surface bg-surface-container-lowest p-3 font-mono-style text-body-md focus:outline-none focus:border-secondary focus:ring-0 transition-colors" 
                      id="codename" 
                      name="codename" 
                      placeholder="e.g. SHADOW_HAWK_01" 
                      required 
                      type="text"
                      value={codename}
                      onChange={(e) => setCodename(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="font-mono-style text-on-surface-variant mt-2 text-[10px]">Alphanumeric designations only. No real names permitted.</p>
                  </div>

                  {/* Operative Email */}
                  <div className="flex flex-col">
                    <label className="font-label-bold text-label-bold uppercase mb-2 text-on-surface" htmlFor="email">OPERATIVE EMAIL</label>
                    <input 
                      className="border-2 border-on-surface bg-surface-container-lowest p-3 font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-0 transition-colors" 
                      id="email" 
                      name="email" 
                      placeholder="operative@ijp-secure.net" 
                      required 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Clearance Code */}
                  <div className="flex flex-col">
                    <label className="font-label-bold text-label-bold uppercase mb-2 text-on-surface" htmlFor="password">CLEARANCE CODE (PASSWORD)</label>
                    <input 
                      className="border-2 border-on-surface bg-surface-container-lowest p-3 font-mono-style text-body-md focus:outline-none focus:border-secondary focus:ring-0 transition-colors" 
                      id="password" 
                      name="password" 
                      placeholder="••••••••••••" 
                      required 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Sector Selection */}
                  <div className="flex flex-col">
                    <label className="font-label-bold text-label-bold uppercase mb-2 text-on-surface" htmlFor="sector">SECTOR ALLOCATION (GRADE)</label>
                    <div className="relative">
                      <select 
                        className="border-2 border-on-surface bg-surface-container-lowest w-full p-3 font-body-md text-body-md appearance-none focus:outline-none focus:border-secondary" 
                        id="sector" 
                        name="sector"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="" disabled>AWAITING ASSIGNMENT...</option>
                        <option value="g9">Sector 9 (Initiate)</option>
                        <option value="g10">Sector 10 (Standard)</option>
                        <option value="g11">Sector 11 (Advanced)</option>
                        <option value="g12">Sector 12 (Vanguard)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface">
                        <span className="material-symbols-outlined">arrow_drop_down</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biometric Scan Section (Fully functional micro-interaction) */}
                <div className="border-2 border-on-surface p-6 bg-surface mt-8 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,#1a1c1c_25%,transparent_25%,transparent_75%,#1a1c1c_75%,#1a1c1c),repeating-linear-gradient(45deg,#1a1c1c_25%,#f9f9f9_25%,#f9f9f9_75%,#1a1c1c_75%,#1a1c1c)] bg-[position:0_0,10px_10px] bg-[size:20px_20px]"></div>
                  
                  {/* SCANNING BAR ELEMENT */}
                  {scanState === 'SCANNING' && (
                    <div className="absolute inset-x-0 h-1 bg-secondary animate-pulse" style={{ top: `${scanProgress}%` }}></div>
                  )}

                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="font-label-bold text-label-bold uppercase text-on-surface mb-1">BIOMETRIC VERIFICATION</h3>
                      <p className="font-mono-style text-mono-style text-on-surface-variant text-[11px]">
                        {scanState === 'IDLE' && 'Identity confirmation required for clearance protocol 7A.'}
                        {scanState === 'SCANNING' && `ANALYZING DERMAL RIDGES: ${scanProgress}%`}
                        {scanState === 'SUCCESS' && 'SECURE SIGNATURE VERIFIED. AUTH LEVEL 9 SECURED.'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={handleBiometricScan}
                      className={`font-label-bold text-label-bold uppercase px-6 py-3 border-2 border-on-surface bureaucratic-shadow-hover transition-all flex items-center gap-2 whitespace-nowrap btn-press ${
                        scanState === 'IDLE' ? 'bg-on-surface text-surface-container-lowest' :
                        scanState === 'SCANNING' ? 'bg-primary-container text-on-primary-container animate-pulse' :
                        'bg-secondary-container text-on-secondary-container border-secondary'
                      }`}
                      type="button"
                      disabled={scanState !== 'IDLE' || isSubmitting}
                    >
                      <span className="material-symbols-outlined">
                        {scanState === 'SUCCESS' ? 'check_circle' : 'fingerprint'}
                      </span>
                      {scanState === 'IDLE' && 'INITIATE SCAN'}
                      {scanState === 'SCANNING' && 'SCANNING...'}
                      {scanState === 'SUCCESS' && 'SCAN COMPLETE'}
                    </button>
                  </div>
                </div>

                {/* Disclaimers */}
                <div className="space-y-4 pt-6 border-t-2 border-on-surface border-dashed">
                  <div className="flex items-start gap-4">
                    <input 
                      className="mt-1 cursor-pointer w-5 h-5 border-2 border-on-surface text-primary focus:ring-0 checked:bg-on-surface" 
                      id="terms" 
                      name="terms" 
                      required 
                      type="checkbox"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <label className="font-mono-style text-mono-style text-on-surface-variant text-[11px] leading-tight cursor-pointer" htmlFor="terms">
                      I acknowledge that by enlisting, I surrender my morning sleep cycles to the state. I agree to the <a className="text-primary underline decoration-2 hover:bg-primary hover:text-on-primary transition-colors" href="#">Propaganda Guidelines</a> and accept that dissent will be logged.
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col text-left">
                    <span className="font-mono-style text-mono-style text-on-surface-variant text-[10px]">SERIAL: IJP-ENL-4928-XX</span>
                    <Link to="/login" className="font-mono-style text-mono-style text-[11px] text-primary hover:underline uppercase mt-1">
                      Already registered? Proceed to secure uplink
                    </Link>
                  </div>
                  <button 
                    className="bg-primary text-on-primary font-headline-lg-mobile text-body-lg md:text-headline-lg-mobile uppercase px-12 py-4 border-2 border-on-surface bureaucratic-shadow bureaucratic-shadow-hover transition-all w-full sm:w-auto disabled:opacity-75 disabled:cursor-not-allowed" 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'PROCESSING...' : 'SUBMIT DOSSIER'}
                  </button>
                </div>
              </form>

              {/* Stamp Decoration */}
              <div className="absolute bottom-12 right-12 transform rotate-[-15deg] pointer-events-none opacity-80 mix-blend-multiply">
                <div className="border-4 border-error p-2 w-max">
                  <span className="font-display-lg text-[32px] text-error uppercase tracking-widest leading-none block border-2 border-error p-1">UNVERIFIED</span>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Simple Footer for context */}
      <footer className="w-full mt-12 text-center py-6 relative z-10">
        <p className="font-mono-style text-mono-style text-on-surface-variant uppercase">© 1984 ISHAN JANTA PARTY. ALL TRUTHS RESERVED.</p>
      </footer>
    </div>
  );
}
