import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function StudentHub() {
  const { user, signOutOperative } = useAuth();
  const navigate = useNavigate();

  // Homework tasks interactive state
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Math: Algebraic Aggression', due: '0800 HRS, TOMORROW', priority: 'CRITICAL PRIORITY', completed: false },
    { id: 2, name: 'History: The Pre-IJP Dark Ages', due: 'COMPLETED', priority: 'NEUTRALIZED', completed: true },
  ]);

  // Poll state
  const [selectedPoll, setSelectedPoll] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [pollResults, setPollResults] = useState({
    bioWeapon: 87,
    premiumProtein: 13,
  });

  // Calculate dynamic weekly quota progress
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const nextCompleted = !task.completed;
        return {
          ...task,
          completed: nextCompleted,
          due: nextCompleted ? 'COMPLETED' : '0800 HRS, TOMORROW',
          priority: nextCompleted ? 'NEUTRALIZED' : 'CRITICAL PRIORITY'
        };
      }
      return task;
    }));
  };

  const handlePollSubmit = (e) => {
    e.preventDefault();
    if (!selectedPoll) return;
    
    // Simulate updating database and calculating percentages
    if (selectedPoll === 'bio') {
      setPollResults({ bioWeapon: 88, premiumProtein: 12 });
    } else {
      setPollResults({ bioWeapon: 86, premiumProtein: 14 });
    }
    setHasVoted(true);
  };

  // Convert section to human-readable label
  const getSectionLabel = (sec) => sec ? `Division ${sec}` : 'Division A';

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen overflow-x-hidden selection:bg-primary selection:text-on-primary relative flex">
      {/* SideNavBar (Web Only) */}
      <nav className="hidden md:flex bg-surface-container-highest dark:bg-surface-dim h-screen w-64 border-r-2 border-on-surface fixed left-0 top-0 flex-col p-4 z-40">
        <div className="mb-8 flex flex-col items-start gap-4">
          <div className="w-16 h-16 bg-on-surface border-2 border-on-surface flex items-center justify-center rounded-DEFAULT shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-surface-container-lowest text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tighter leading-none cursor-pointer" onClick={() => navigate('/')}>IJP</h1>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase tracking-tight leading-none mt-1">DIRECTORATE</h2>
            <p className="font-mono-style text-mono-style uppercase text-on-surface-variant mt-2 border-b-2 border-on-surface pb-1 inline-block text-primary">
              {user?.role === 'admin' ? 'CLASS-A ADMIN' : 'CLASS-A ACCESS'}
            </p>
          </div>
        </div>

        <div className="mb-6 bg-surface p-3 border-2 border-on-surface text-xs font-mono-style uppercase">
          <div className="text-tertiary">CODENAME:</div>
          <div className="font-bold text-on-surface text-sm truncate">{user?.codename}</div>
          <div className="text-tertiary mt-2">SECTION:</div>
          <div className="font-bold text-on-surface text-[10px] truncate">{getSectionLabel(user?.section)}</div>
          <div className="text-tertiary mt-2">ID:</div>
          <div className="font-bold text-primary text-[10px]">{user?.unique_id}</div>
        </div>

        <ul className="flex flex-col gap-2 flex-grow">
          <li>
            <Link className="bg-secondary-container text-on-secondary-container border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase translate-x-1 transition-transform duration-75" to="/student-hub">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              Grade 9 Hub
            </Link>
          </li>
          <li>
            <Link className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 border-transparent hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/truth-directorate">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              Homework Tracker
            </Link>
          </li>
          <li>
            <Link className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 border-transparent hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/truth-directorate">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
              Reporting Tools
            </Link>
          </li>
          {user?.role === 'admin' && (
            <li>
              <Link className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 border-transparent hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/admin">
                <span className="material-symbols-outlined">gavel</span>
                ADMIN DASHBOARD
              </Link>
            </li>
          )}
        </ul>
        
        <div className="mt-auto pt-8">
          <button 
            onClick={signOutOperative}
            className="w-full bg-primary text-on-primary font-label-bold text-label-bold uppercase py-3 px-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            SECURE LOGOUT
          </button>
        </div>
      </nav>

      {/* TopAppBar (Mobile Only) */}
      <header className="md:hidden bg-background border-b-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] fixed top-0 left-0 w-full z-40 flex justify-between items-center px-margin-mobile py-4">
        <div className="font-headline-lg-mobile text-headline-lg-mobile text-primary uppercase tracking-tighter leading-none cursor-pointer" onClick={() => navigate('/')}>IJP</div>
        <div className="flex gap-2">
          <Link to="/truth-directorate" className="bg-surface border-2 border-on-surface px-3 py-1 font-label-bold text-label-bold text-xs uppercase flex items-center">REPORTS</Link>
          <button 
            onClick={signOutOperative}
            className="bg-primary text-on-primary border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-label-bold text-label-bold text-xs uppercase"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow md:ml-64 pt-24 md:pt-0 min-h-screen relative pb-32 md:pb-0">
        <div className="px-margin-mobile md:px-margin-desktop py-12 max-w-[container-max] mx-auto flex flex-col gap-gutter">
          
          {/* Page Header */}
          <header className="mb-8 border-b-4 border-on-surface pb-6 text-left">
            <div className="inline-block bg-on-surface text-surface-container-lowest px-2 py-1 font-mono-style text-mono-style uppercase mb-4 shadow-[2px_2px_0px_0px_#ff9933]">
              <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              CLASSIFIED: DIVISION {user?.section || 'A'} EYES ONLY
            </div>
            <h1 className="font-display-lg text-headline-xl md:text-display-lg text-on-surface uppercase tracking-tighter leading-none">OPERATION: NINTH GRADE</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-2xl">
              Welcome back, Operative <strong className="text-primary font-bold">{user?.codename}</strong> ({user?.unique_id}). 
              Track munitions, monitor assessments, and access propaganda materials here. Compliance is mandatory.
            </p>
          </header>

          {/* 3 Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
            
            {/* Homework Munitions (Tracker) */}
            <section className="space-y-6 text-left">
              <div className="bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative p-6 mt-10">
                {/* Dossier Tab */}
                <div className="absolute -top-10 left-[-2px] bg-surface-container-lowest border-2 border-on-surface border-b-0 px-4 py-2 font-label-bold text-label-bold uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>folder_special</span>
                  HOMEWORK MUNITIONS
                </div>
                <div className="absolute top-2 right-4 font-mono-style text-mono-style text-tertiary">SR-NO. 849-B</div>
                
                <div className="mt-4 space-y-6">
                  {tasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex flex-col xl:flex-row xl:items-center gap-4 p-4 border-2 border-on-surface bg-surface hover:bg-surface-variant transition-colors group cursor-pointer"
                    >
                      <div className={`flex-shrink-0 w-8 h-8 border-2 border-on-surface flex items-center justify-center transition-colors ${
                        task.completed ? 'bg-on-surface' : 'bg-surface-container-lowest group-hover:bg-primary-container'
                      }`}>
                        {task.completed && (
                          <span className="material-symbols-outlined text-surface-container-lowest font-bold">close</span>
                        )}
                      </div>
                      <div className={`flex-grow ${task.completed ? 'opacity-60 line-through' : ''}`}>
                        <h3 className="font-label-bold text-label-bold uppercase text-on-surface leading-tight">{task.name}</h3>
                        <p className="font-mono-style text-mono-style text-on-surface-variant mt-1">Due: {task.due}</p>
                      </div>
                      <div className={`flex-shrink-0 ${task.completed ? 'opacity-60' : ''}`}>
                        <span className={`font-mono-style text-[10px] sm:text-mono-style px-2 py-1 uppercase border border-on-surface inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          task.completed ? 'bg-secondary-container text-on-secondary-container' : 'bg-error text-on-error'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Progress Section */}
                  <div className="pt-4 border-t-2 border-on-surface border-dashed">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-label-bold text-label-bold uppercase">Weekly Deployment Quota</span>
                      <span className="font-mono-style text-mono-style">{progressPercent}%</span>
                    </div>
                    <div className="h-6 w-full bg-on-surface border-2 border-on-surface p-1 flex">
                      <div 
                        className="h-full bg-secondary-fixed border-r-2 border-on-surface transition-all duration-300" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Exam Intelligence */}
            <section className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full text-left">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-on-surface pb-2">
                <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile uppercase text-on-surface leading-none">EXAM INTEL</h2>
              </div>
              <ul className="space-y-6">
                <li className="border-l-4 border-error pl-4">
                  <div className="font-mono-style text-mono-style text-error mb-1">T-MINUS 48 HOURS</div>
                  <h4 className="font-label-bold text-label-bold uppercase text-on-surface">Biology: Cellular Sabotage</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">Room 402. Bring #2 pencils and absolute loyalty.</p>
                </li>
                <li className="border-l-4 border-tertiary-fixed-dim pl-4">
                  <div className="font-mono-style text-mono-style text-on-surface-variant mb-1">T-MINUS 7 DAYS</div>
                  <h4 className="font-label-bold text-label-bold uppercase text-on-surface">English: Rhetorical Warfare</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">Essay submission. Propaganda techniques analyzed.</p>
                </li>
              </ul>
            </section>

            {/* Poll of the Day */}
            <section className="bg-primary-container border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative overflow-hidden h-full flex flex-col justify-between text-left">
              {/* Redaction bars for style */}
              <div className="absolute top-4 right-4 w-16 h-4 bg-on-surface"></div>
              <div className="absolute top-10 right-4 w-10 h-4 bg-on-surface"></div>
              
              <div>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary-container uppercase mb-2">THE VOX POPULI</h2>
                <p className="font-body-md text-body-md text-on-primary-fixed-variant mb-6 font-bold pr-16">
                  Is the cafeteria serving "mystery meat" again, or is it a deliberate attempt to test our gastrointestinal fortitude?
                </p>
              </div>

              {hasVoted ? (
                /* Poll Results Display */
                <div className="space-y-4 bg-surface p-4 border-2 border-on-surface bureaucratic-shadow">
                  <div className="font-mono-style text-[10px] text-tertiary uppercase">SECTOR OPINION INTAKE COMPLETED</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between font-mono-style text-xs">
                        <span>BIO-WEAPON</span>
                        <span>{pollResults.bioWeapon}%</span>
                      </div>
                      <div className="w-full h-4 border-2 border-on-surface bg-surface-container-highest relative">
                        <div className="absolute inset-y-0 left-0 bg-error" style={{ width: `${pollResults.bioWeapon}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono-style text-xs">
                        <span>PREMIUM PROTEIN</span>
                        <span>{pollResults.premiumProtein}%</span>
                      </div>
                      <div className="w-full h-4 border-2 border-on-surface bg-surface-container-highest relative">
                        <div className="absolute inset-y-0 left-0 bg-secondary" style={{ width: `${pollResults.premiumProtein}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono-style text-secondary uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span> Vote recorded in Central Core.
                  </div>
                </div>
              ) : (
                /* Poll Form */
                <form onSubmit={handlePollSubmit} className="flex flex-col gap-3 mt-auto">
                  <label className="flex items-center gap-3 p-3 border-2 border-on-surface bg-surface-container-lowest cursor-pointer hover:bg-primary transition-colors group">
                    <input 
                      className="w-5 h-5 border-2 border-on-surface text-primary focus:ring-0 checked:bg-on-surface bg-transparent" 
                      name="poll" 
                      type="radio"
                      value="bio"
                      checked={selectedPoll === 'bio'}
                      onChange={() => setSelectedPoll('bio')}
                    />
                    <span className="font-label-bold text-label-bold uppercase group-hover:text-on-primary transition-colors leading-tight">
                      Yes, it's a bio-weapon.
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border-2 border-on-surface bg-surface-container-lowest cursor-pointer hover:bg-primary transition-colors group">
                    <input 
                      className="w-5 h-5 border-2 border-on-surface text-primary focus:ring-0 checked:bg-on-surface bg-transparent" 
                      name="poll" 
                      type="radio"
                      value="protein"
                      checked={selectedPoll === 'protein'}
                      onChange={() => setSelectedPoll('protein')}
                    />
                    <span className="font-label-bold text-label-bold uppercase group-hover:text-on-primary transition-colors leading-tight">
                      No, it's premium protein.
                    </span>
                  </label>
                  <button 
                    className="mt-4 bg-on-surface text-surface-container-lowest font-label-bold text-label-bold uppercase py-3 border-2 border-on-surface shadow-[4px_4px_0px_0px_#ffb77a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-y-[4px]" 
                    type="submit"
                  >
                    SUBMIT RESPONSE
                  </button>
                </form>
              )}
            </section>
          </div>

          {/* Study Resources (Bento Grid Style) */}
          <section className="mt-8 text-left">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-6 border-b-4 border-on-surface inline-block pb-1">APPROVED STUDY RESOURCES</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Resource 1 */}
              <a className="bg-secondary text-on-secondary p-6 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col justify-between aspect-square group" href="#">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-4xl">book_5</span>
                  <span className="font-mono-style text-mono-style border border-on-secondary px-1">PDF</span>
                </div>
                <div>
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile uppercase leading-none group-hover:underline">MATH FORMULAS v3.2</h3>
                  <p className="font-mono-style text-mono-style mt-2 opacity-80">UPDATED: 09/24</p>
                </div>
              </a>
              {/* Resource 2 */}
              <a className="bg-surface-container-lowest text-on-surface p-6 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col justify-between aspect-square group md:col-span-2 relative overflow-hidden" href="#">
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <span className="material-symbols-outlined text-4xl text-primary">smart_display</span>
                  <span className="bg-primary text-on-primary font-mono-style text-mono-style border-2 border-on-surface px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">VIDEO DEBRIEF</span>
                </div>
                <div className="relative z-10">
                  <h3 className="font-headline-lg text-headline-lg uppercase leading-none group-hover:text-primary transition-colors">HISTORY: WORLD WAR LECTURE SERIES</h3>
                  <p className="font-mono-style text-mono-style mt-2 text-on-surface-variant">DURATION: 45:00</p>
                </div>
              </a>
              {/* Resource 3 */}
              <a className="bg-surface-variant text-on-surface p-6 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col justify-between aspect-square group" href="#">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-4xl">quiz</span>
                  <span className="font-mono-style text-mono-style border border-on-surface px-1">INTERACTIVE</span>
                </div>
                <div>
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile uppercase leading-none group-hover:underline">PRACTICE EXAMS</h3>
                  <p className="font-mono-style text-mono-style mt-2 opacity-80">TEST YOUR LOYALTY</p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-on-tertiary-fixed dark:bg-surface-container-lowest w-full border-t-2 border-on-surface py-8 px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter md:ml-64 absolute bottom-0 left-0 z-20">
        <div className="text-left">
          <h2 className="font-headline-xl text-headline-xl text-primary leading-none mb-4 uppercase tracking-tighter">IJP</h2>
          <p className="font-mono-style text-mono-style uppercase text-tertiary-fixed-dim">© 1984 ISHAN JANTA PARTY. ALL TRUTHS RESERVED.</p>
        </div>
        <div className="flex flex-col md:items-end justify-center gap-2">
          <Link className="text-tertiary-fixed-dim hover:text-primary font-mono-style text-mono-style uppercase hover:bg-primary hover:text-on-primary px-2 transition-all self-start md:self-end" to="/truth-directorate">LEGAL LIES</Link>
          <Link className="text-tertiary-fixed-dim hover:text-primary font-mono-style text-mono-style uppercase hover:bg-primary hover:text-on-primary px-2 transition-all self-start md:self-end" to="/truth-directorate">PRIVACY ILLUSION</Link>
          <Link className="text-primary underline font-mono-style text-mono-style uppercase hover:bg-primary hover:text-on-primary px-2 transition-all self-start md:self-end animate-pulse" to="/student-hub">STUDENT PORTAL</Link>
        </div>
      </footer>
    </div>
  );
}
