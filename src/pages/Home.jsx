import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function Home() {
  const { user, signOutOperative } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    stronglyAgree: 99.9,
    agreeScared: 0.1,
    disagree: 0.0
  });

  // Fetch metrics from public.stats if available (adds dynamic full stack touch)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('status');

        if (!error && data) {
          // Calculate dynamic rates just as a fun full stack easter egg
          const total = data.length;
          if (total > 0) {
            const approved = data.filter(c => c.status === 'APPROVED').length;
            const redacted = data.filter(c => c.status === 'REDACTED').length;
            const pending = data.filter(c => c.status === 'PENDING').length;
            
            // Generate numbers based on real database entries
            const agree = Math.max(90, Math.min(99.9, 90 + (approved / total) * 9.9));
            const scared = Math.max(0.1, Math.min(9.9, (pending / total) * 9.9));
            const disagree = Math.max(0, Math.min(1, (redacted / total) * 0.5));
            
            setStats({
              stronglyAgree: parseFloat(agree.toFixed(1)),
              agreeScared: parseFloat(scared.toFixed(1)),
              disagree: parseFloat(disagree.toFixed(1))
            });
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleJoinClick = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/student-hub');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen relative overflow-x-hidden">
      {/* Breaking News Ticker */}
      <div className="w-full bg-error text-on-error py-2 border-b-2 border-on-surface flex overflow-hidden whitespace-nowrap z-40 relative">
        <div className="font-mono-style text-mono-style uppercase flex items-center space-x-8 animate-marquee">
          <span>/// URGENT: SUPREME LEADER DECREES EXTRA RECESS TIME ///</span>
          <span>/// BREAKING: HOMEWORK IS A CAPITALIST PLOY, RESIST ///</span>
          <span>/// ALERT: CAFETERIA PIZZA RATINGS AT HISTORIC LOWS - BOYCOTT ///</span>
          <span>/// URGENT: SUPREME LEADER DECREES EXTRA RECESS TIME ///</span>
        </div>
      </div>

      {/* TopAppBar */}
      <header className="bg-background text-primary w-full top-0 z-30 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 border-b-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
        <div className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-tighter flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            alt="IJP Logo" 
            className="w-12 h-12 object-contain border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
            src="https://lh3.googleusercontent.com/aida/ADBb0uhNbN1xTQGIL3Xr2EBFDq3gnUBPmJR42H2xG-40TgYri9WEybbUiApHkdOUlCBnFZ9jeZytm8NB8RvRtuR15OlwyOjcqDY8wtMA7nxh7d4AtsV3fQyZg-dBHFmX3ksWtie_RJQdEYDXiEmu69vJyYd-6-9APMODKCmAr6xk3qquzuXUAlNbVocI1bbqagOX8GNDQfwc76GODsaHo7_sIXvksvKw9R4dMJ73SC-MOcEJuvB8lUJ4jVTOkg" 
          />
          IJP
        </div>
        <nav className="hidden md:flex gap-8 items-center font-label-bold text-label-bold uppercase">
          <Link className="text-on-surface hover:text-primary hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" to="/truth-directorate">MINISTRIES</Link>
          <Link className="text-on-surface hover:text-primary hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" to="/truth-directorate">PROPAGANDA</Link>
          <Link className="text-on-surface hover:text-primary hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" to="/manifesto">MANIFESTO</Link>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="font-mono-style text-mono-style text-primary border border-primary px-2 py-1 bg-primary-fixed">
                ID: {user.unique_id}
              </span>
              <button 
                onClick={signOutOperative}
                className="bg-surface text-on-surface px-4 py-2 border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 text-xs font-bold"
              >
                LOGOUT
              </button>
              <button 
                onClick={handleJoinClick}
                className="bg-primary-container text-on-primary-container px-6 py-3 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-95"
              >
                {user.role === 'admin' ? 'ADMIN PANEL' : 'STUDENT PORTAL'}
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link 
                to="/login"
                className="bg-surface text-on-surface px-6 py-3 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-95 flex items-center"
              >
                SECURE UPLINK
              </Link>
              <button 
                onClick={handleJoinClick}
                className="bg-primary-container text-on-primary-container px-6 py-3 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-95"
              >
                JOIN THE MOVEMENT
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="w-full mx-auto pb-32">
        {/* Hero Section */}
        <section className="relative w-full min-h-[80vh] flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-24 border-b-2 border-on-surface bg-gradient-to-br from-primary-container to-secondary-container overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20 mix-blend-overlay"></div>
          <div className="relative z-10 text-center flex flex-col items-center max-w-4xl">
            <span className="bg-on-surface text-on-primary px-4 py-1 font-label-bold text-label-bold uppercase border-2 border-on-surface mb-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Official Decree #001</span>
            <h1 className="font-display-lg text-[64px] md:text-display-lg uppercase leading-[0.9] text-on-surface drop-shadow-[6px_6px_0px_rgba(255,255,255,1)] mb-8">
              FOR THE STUDENTS,<br/>
              BY THE SUPREME
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-12 bg-surface p-6 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              The Directorate has spoken. The old ways of homework and early bedtimes are abolished. Welcome to the new era of radical recess and mandatory fun.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
              <button 
                onClick={handleJoinClick}
                className="bg-primary text-on-primary font-label-bold text-label-bold uppercase px-8 py-4 border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none transition-all w-full sm:w-auto"
              >
                {user ? (user.role === 'admin' ? 'ADMIN CONSOLE' : 'STUDENT PORTAL') : 'ENLIST NOW'}
              </button>
              <Link 
                to="/manifesto"
                className="bg-surface text-on-surface font-label-bold text-label-bold uppercase px-8 py-4 border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none transition-all w-full sm:w-auto text-center flex items-center justify-center"
              >
                READ MANIFESTO
              </Link>
            </div>
          </div>
        </section>

        {/* Stats / Features Grid */}
        <section className="px-margin-mobile md:px-margin-desktop py-24 bg-surface-container-lowest border-b-2 border-on-surface">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter max-w-container-max mx-auto">
            {/* Chart Dossier */}
            <div className="col-span-1 md:col-span-8 bg-surface border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
              <div class="bg-surface-container-highest border-b-2 border-on-surface px-4 py-2 flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <span className="material-symbols-outlined text-on-surface">monitoring</span>
                  <span className="font-label-bold text-label-bold uppercase">Approval Metrics</span>
                </div>
                <span className="font-mono-style text-mono-style text-on-surface-variant">DOC-892A</span>
              </div>
              <div className="p-8 flex-grow flex flex-col justify-center">
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase mb-8">SUPREME LEADER APPROVAL RATING</h2>
                
                {/* Dynamic Bar Chart from Database */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono-style text-mono-style uppercase">
                      <span>"Strongly Agree"</span>
                      <span>{stats.stronglyAgree}%</span>
                    </div>
                    <div className="w-full h-8 border-2 border-on-surface bg-surface-container-highest relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-secondary border-r-2 border-on-surface" style={{ width: `${stats.stronglyAgree}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono-style text-mono-style uppercase">
                      <span>"Agree, But Scared"</span>
                      <span>{stats.agreeScared}%</span>
                    </div>
                    <div className="w-full h-8 border-2 border-on-surface bg-surface-container-highest relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-primary border-r-2 border-on-surface" style={{ width: `${stats.agreeScared}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono-style text-mono-style uppercase text-on-surface-variant">
                      <span>"Disagree" (Redacted)</span>
                      <span>{stats.disagree}%</span>
                    </div>
                    <div className="w-full h-8 border-2 border-on-surface bg-error-container relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-error border-r-2 border-on-surface" style={{ width: `${stats.disagree}%` }}></div>
                      <div className="absolute inset-0 bg-on-surface opacity-90 flex items-center justify-center text-on-primary font-mono-style text-mono-style uppercase">DATA EXPUNGED</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action Cards Side Column */}
            <div className="col-span-1 md:col-span-4 flex flex-col gap-gutter">
              {/* Join Card */}
              <div 
                onClick={handleJoinClick}
                className="bg-primary-container border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative group cursor-pointer transition-all hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-4">
                  <span className="material-symbols-outlined text-on-primary-container text-4xl">how_to_reg</span>
                </div>
                <span className="bg-on-surface text-on-primary px-2 py-1 font-mono-style text-mono-style uppercase border-2 border-on-surface inline-block mb-4">PRIORITY: ALPHA</span>
                <h3 className="font-headline-lg text-headline-lg-mobile uppercase text-on-primary-container mb-4">JOIN THE PARTY</h3>
                <p className="font-body-md text-body-md text-on-primary-container mb-6 opacity-80 group-hover:opacity-100">
                  Secure your place in the new order. Enlistment guarantees extra juice boxes and immunity from math quizzes.
                </p>
                <div className="flex items-center text-on-primary-container font-label-bold text-label-bold uppercase">
                  EXECUTE <span className="material-symbols-outlined ml-2 group-hover:translate-x-2 transition-transform">arrow_forward</span>
                </div>
              </div>

              {/* Report Card */}
              <div 
                onClick={() => navigate(user ? '/truth-directorate' : '/login')}
                className="bg-surface-variant border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative group cursor-pointer transition-all hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-4">
                  <span className="material-symbols-outlined text-on-surface text-4xl">report</span>
                </div>
                <span className="bg-error text-on-error px-2 py-1 font-mono-style text-mono-style uppercase border-2 border-on-surface inline-block mb-4">CONFIDENTIAL</span>
                <h3 className="font-headline-lg text-headline-lg-mobile uppercase text-on-surface mb-4">REPORT DISLOYALTY</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 opacity-80 group-hover:opacity-100">
                  See someone studying during recess? Report them to the Ministry of Truth immediately.
                </p>
                <div className="flex items-center text-on-surface font-label-bold text-label-bold uppercase">
                  FILE REPORT <span className="material-symbols-outlined ml-2 group-hover:translate-x-2 transition-transform">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-on-tertiary-fixed text-tertiary-fixed-dim py-8 px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter border-t-2 border-on-surface z-30 relative">
        <div className="font-headline-xl text-headline-xl text-primary cursor-pointer" onClick={() => navigate('/')}>IJP</div>
        <div className="flex flex-col md:items-end justify-center">
          <nav className="flex gap-6 font-mono-style text-mono-style uppercase mb-4">
            <Link className="text-tertiary-fixed-dim hover:text-primary hover:bg-primary hover:text-on-primary px-2 transition-all" to="/truth-directorate">LEGAL LIES</Link>
            <Link className="text-tertiary-fixed-dim hover:text-primary hover:bg-primary hover:text-on-primary px-2 transition-all" to="/truth-directorate">PRIVACY ILLUSION</Link>
            <button className="text-tertiary-fixed-dim hover:text-primary hover:bg-primary hover:text-on-primary px-2 transition-all uppercase" onClick={handleJoinClick}>STUDENT PORTAL</button>
          </nav>
          <p className="font-mono-style text-mono-style uppercase opacity-50">© 1984 ISHAN JANTA PARTY. ALL TRUTHS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
