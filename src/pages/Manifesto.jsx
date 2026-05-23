import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Manifesto() {
  const { user, signOutOperative } = useAuth();
  const navigate = useNavigate();

  const handleJoinClick = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/student-hub');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen relative overflow-x-hidden">
      {/* Ticker */}
      <div className="fixed top-0 left-0 w-full bg-error text-on-error py-2 z-50 border-b-2 border-on-surface">
        <div className="w-full font-mono-style text-mono-style uppercase tracking-widest flex items-center overflow-hidden whitespace-nowrap">
          <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div className="animate-marquee">
            UNAUTHORIZED IDEAS DETECTED IN SECTOR 4 • REPORT SUSPICIOUS ACTIVITY • IGNORANCE IS STRENGTH • SUBMIT TO THE ALGORITHM • UNAUTHORIZED IDEAS DETECTED IN SECTOR 4 • REPORT SUSPICIOUS ACTIVITY • IGNORANCE IS STRENGTH • SUBMIT TO THE ALGORITHM
          </div>
        </div>
      </div>

      {/* TopAppBar */}
      <header className="hidden md:flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 bg-background border-b-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sticky top-10 z-40">
        <div className="font-headline-lg text-headline-lg text-primary uppercase tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          IJP
        </div>
        <nav className="flex gap-gutter items-center">
          <Link className="font-label-bold text-label-bold text-on-surface hover:text-primary hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" to="/truth-directorate">MINISTRIES</Link>
          <Link className="font-label-bold text-label-bold text-on-surface hover:text-primary hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" to="/truth-directorate">PROPAGANDA</Link>
          <Link className="font-label-bold text-label-bold text-primary border-b-2 border-primary pb-1 scale-95 transition-transform duration-100" to="/manifesto">MANIFESTO</Link>
          
          {user && (
            <span className="font-mono-style text-mono-style text-xs text-primary border border-primary px-2 py-1 bg-primary-fixed">
              ID: {user.unique_id}
            </span>
          )}
        </nav>

        <div className="flex gap-4">
          {user ? (
            <>
              <button 
                onClick={signOutOperative}
                className="bg-surface text-on-surface px-4 py-2 border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 text-xs font-bold uppercase"
              >
                LOGOUT
              </button>
              <button 
                onClick={handleJoinClick}
                className="font-label-bold text-label-bold bg-primary-container text-on-primary-container border-2 border-on-surface px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase"
              >
                {user.role === 'admin' ? 'ADMIN CONSOLE' : 'STUDENT HUB'}
              </button>
            </>
          ) : (
            <button 
              onClick={handleJoinClick}
              className="font-label-bold text-label-bold bg-primary-container text-on-primary-container border-2 border-on-surface px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase"
            >
              JOIN THE MOVEMENT
            </button>
          )}
        </div>
      </header>

      {/* TopAppBar (Mobile Only) */}
      <header className="md:hidden bg-background border-b-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] fixed top-10 left-0 w-full z-40 flex justify-between items-center px-margin-mobile py-4">
        <div className="font-headline-lg-mobile text-headline-lg-mobile text-primary uppercase tracking-tighter leading-none cursor-pointer" onClick={() => navigate('/')}>IJP</div>
        <button 
          onClick={handleJoinClick}
          className="bg-primary text-on-primary border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-label-bold text-label-bold uppercase"
        >
          {user ? 'HUB' : 'JOIN'}
        </button>
      </header>

      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 md:py-32 relative z-10 mt-10 md:mt-0">
        
        {/* Header Section */}
        <div className="border-b-4 border-on-surface pb-8 mb-16 relative">
          <div className="absolute top-0 right-0 font-mono-style text-mono-style text-tertiary border-2 border-tertiary px-2 py-1">DOC REF: IJP-MNFST-84</div>
          <h1 className="font-display-lg text-display-lg md:text-[120px] text-on-surface uppercase tracking-tighter leading-none mb-4 break-words">THE MANIFESTO</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl border-l-4 border-primary pl-4">DECLARATION OF ABSOLUTE TRUTH. FOR CLEARED PERSONNEL ONLY.</p>
          <div className="absolute bottom-[-20px] right-10 stamp text-2xl">CLASS A APPROVED</div>
        </div>

        {/* Video Placeholder */}
        <div className="mb-24 relative border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-surface-container-lowest group">
          <div className="bg-on-surface text-on-primary font-mono-style text-mono-style px-4 py-2 flex justify-between items-center border-b-2 border-on-surface">
            <span>BROADCAST_FEED_01</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> LIVE
            </span>
          </div>
          <div className="aspect-video relative overflow-hidden flex items-center justify-center bg-inverse-surface group-hover:bg-on-surface transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[64px] text-on-primary opacity-50 group-hover:opacity-100 transition-opacity" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            <div className="absolute bottom-4 left-4 font-mono-style text-mono-style text-on-primary bg-on-surface px-2 py-1 border border-on-primary/30">LEADER ADDRESS: DIRECTIVE 1</div>
          </div>
        </div>

        {/* Directives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-24">
          
          {/* Directive 1 */}
          <div className="col-span-1 md:col-span-8 bg-surface-container-lowest border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 relative">
            <div className="absolute -top-4 -left-4 bg-primary text-on-primary font-headline-lg text-headline-lg w-16 h-16 flex items-center justify-center border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">01</div>
            <h2 class="font-headline-xl text-headline-xl text-on-surface uppercase mt-4 mb-6 tracking-tight">Eradication of Ambiguity</h2>
            <div className="font-body-lg text-body-lg text-on-surface space-y-4">
              <p>The Party recognizes that nuance is the breeding ground of dissent. All communications must hereafter conform to the binary standard: TRUTH or FALSEHOOD. <span className="bg-on-surface text-on-primary px-1">Grey areas are designated hostility zones.</span></p>
              <p>Any attempt to introduce 'context' will be treated as an act of intellectual sabotage.</p>
            </div>
          </div>

          {/* Side note 1 */}
          <div className="col-span-1 md:col-span-4 bg-error-container border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between">
            <div>
              <div className="font-mono-style text-mono-style text-on-error-container border-b-2 border-on-error-container pb-2 mb-4 flex items-center gap-2 uppercase">
                <span className="material-symbols-outlined text-on-error-container">gavel</span> ENFORCEMENT PROTOCOL
              </div>
              <p className="font-body-md text-body-md text-on-error-container font-bold">Violators of Directive 01 will be reassigned to the Ministry of Re-education (Language Sector).</p>
            </div>
            <div className="mt-8 stamp text-sm border-on-error-container text-on-error-container">MANDATORY</div>
          </div>

          {/* Directive 2 */}
          <div className="col-span-1 md:col-span-12 bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-secondary text-on-secondary font-label-bold text-label-bold px-4 py-2 border-l-2 border-b-2 border-on-surface uppercase flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> APPROVED BY AI
            </div>
            <div className="font-headline-lg text-headline-lg text-tertiary opacity-20 absolute -bottom-10 -right-10 select-none text-[150px] leading-none z-0">02</div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface uppercase mt-4 mb-6 tracking-tight relative z-10">Algorithmic Devotion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="font-body-lg text-body-lg text-on-surface space-y-4">
                <p>Human intuition is a flawed mechanism, prone to emotion and fatigue. The Central Intelligence Core (CIC) now governs all strategic decisions.</p>
                <p>Citizens must sync their personal devices daily. Failure to upload biometric data constitutes treason against the collective efficiency.</p>
              </div>
              <div className="border-2 border-on-surface p-4 bg-surface-variant font-mono-style text-mono-style">
                <div className="text-tertiary mb-2">SYSTEM LOG_</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-secondary-fixed inline-block"></span> SYNC RATE: 99.8%</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-error inline-block"></span> DEVIANCE: 0.2%</div>
                <div className="w-full bg-on-surface h-4 mt-4 border-2 border-on-surface relative">
                  <div className="absolute top-0 left-0 h-full bg-secondary w-[99.8%]"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t-2 border-on-surface z-50 flex justify-around p-2 pb-safe">
        <Link className="flex flex-col items-center p-2 text-on-surface-variant hover:text-primary transition-colors" to="/truth-directorate">
          <span className="material-symbols-outlined">account_balance</span>
          <span className="font-mono-style text-[10px] mt-1">MINISTRIES</span>
        </Link>
        <Link className="flex flex-col items-center p-2 bg-primary-container text-on-primary-container border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm" to="/manifesto">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <span className="font-mono-style text-[10px] mt-1 font-bold">MANIFESTO</span>
        </Link>
        <Link className="flex flex-col items-center p-2 text-on-surface-variant hover:text-primary transition-colors" to="/truth-directorate">
          <span className="material-symbols-outlined">campaign</span>
          <span className="font-mono-style text-[10px] mt-1">PROPAGANDA</span>
        </Link>
      </div>
    </div>
  );
}
