import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { dbService } from '../services/db';
import { processMunition, generateRandomIntel } from '../utils/openai';

export default function StudentHub() {
  const { user, signOutOperative } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [homeworks, setHomeworks] = useState([]);
  const [intel, setIntel] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(() => {
    const saved = localStorage.getItem(`completed_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Submission states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitType, setSubmitType] = useState('HOMEWORK');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Poll state (static for now)
  const [selectedPoll, setSelectedPoll] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [pollResults, setPollResults] = useState({ bioWeapon: 87, premiumProtein: 13 });

  // Calculate dynamic weekly quota progress
  const progressPercent = homeworks.length > 0 
    ? Math.round((completedTasks.length / homeworks.length) * 100) 
    : 0;

  // Load Munitions
  useEffect(() => {
    if (!user) return;

    const fetchMunitions = async () => {
      let data = await dbService.fetchMunitions(user.section || 'A');

      // Filter by type
      let hws = data.filter(d => d.type === 'HOMEWORK');
      let ints = data.filter(d => d.type === 'EXAM_INTEL');

      // If empty, generate random ones using Central Intelligence
      if (hws.length === 0) {
        const randomHw = await generateRandomIntel('HOMEWORK');
        if (randomHw) {
          const newHw = await dbService.insertMunition({
            type: 'HOMEWORK',
            subject: randomHw.subject,
            content: randomHw.content,
            priority: randomHw.priority,
            due_date: randomHw.dueDate,
            section: user.section || 'A',
            user_id: user.id
          });
          if (newHw) hws = [newHw];
        }
      }

      if (ints.length === 0) {
        const randomInt = await generateRandomIntel('EXAM_INTEL');
        if (randomInt) {
          const newInt = await dbService.insertMunition({
            type: 'EXAM_INTEL',
            subject: randomInt.subject,
            content: randomInt.content,
            priority: randomInt.priority,
            due_date: randomInt.dueDate,
            section: user.section || 'A',
            user_id: user.id
          });
          if (newInt) ints = [newInt];
        }
      }

      setHomeworks(hws);
      setIntel(ints);
    };

    fetchMunitions();

    // Realtime subscription
    const subscription = supabase.channel('public:munitions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'munitions' }, payload => {
        if (payload.new && payload.new.section === (user.section || 'A')) {
          fetchMunitions();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Persist completed tasks
  useEffect(() => {
    if (user) {
      localStorage.setItem(`completed_${user.id}`, JSON.stringify(completedTasks));
    }
  }, [completedTasks, user]);

  const toggleTask = (id) => {
    setCompletedTasks(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handlePollSubmit = (e) => {
    e.preventDefault();
    if (!selectedPoll) return;
    if (selectedPoll === 'bio') setPollResults({ bioWeapon: 88, premiumProtein: 12 });
    else setPollResults({ bioWeapon: 86, premiumProtein: 14 });
    setHasVoted(true);
  };

  const handleMunitionSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !content) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const existing = submitType === 'HOMEWORK' ? homeworks : intel;
      // Send to ChatGPT for processing and duplicate check
      const processed = await processMunition(submitType, subject, content, existing);

      if (processed.isDuplicate) {
        setSubmitError("CENTRAL INTELLIGENCE REJECTED: Duplicate intel detected in current section.");
        setIsSubmitting(false);
        return;
      }

      // Insert new munition
      await dbService.insertMunition({
        type: submitType,
        subject: subject,
        content: processed.formattedContent,
        priority: processed.priority,
        due_date: processed.dueDate,
        section: user.section || 'A',
        user_id: user.id
      });
      
      setShowSubmitModal(false);
      setSubject('');
      setContent('');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="mb-6 bg-surface p-3 border-2 border-on-surface text-xs font-mono-style uppercase relative">
          {!user?.verified && (
             <div className="absolute top-1 right-1 bg-error text-on-error px-1 py-0.5 text-[8px] font-bold">UNVERIFIED</div>
          )}
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
            <Link className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 border-transparent hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/profile">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
              DOSSIER (PROFILE)
            </Link>
          </li>
          <li>
            <Link className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 border-transparent hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/truth-directorate">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
              Reporting Tools
            </Link>
          </li>
          <li>
            <Link className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 border-transparent hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/comms-link">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>satellite_alt</span>
              SECURE COMMS LINK
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
            className="w-full bg-error text-on-error font-label-bold text-label-bold uppercase py-3 px-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            SECURE LOGOUT
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow md:ml-64 pt-8 md:pt-0 min-h-screen relative pb-32 md:pb-0">
        <div className="px-margin-mobile md:px-margin-desktop py-12 max-w-[container-max] mx-auto flex flex-col gap-gutter">
          
          {/* Page Header */}
          <header className="mb-8 border-b-4 border-on-surface pb-6 text-left">
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-block bg-on-surface text-surface-container-lowest px-2 py-1 font-mono-style text-mono-style uppercase mb-4 shadow-[2px_2px_0px_0px_#ff9933]">
                  <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  CLASSIFIED: DIVISION {user?.section || 'A'} EYES ONLY
                </div>
                <h1 className="font-display-lg text-headline-xl md:text-display-lg text-on-surface uppercase tracking-tighter leading-none">OPERATION: NINTH GRADE</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-2xl">
                  Welcome back, Operative <strong className="text-primary font-bold">{user?.codename}</strong>. 
                  Track munitions, monitor assessments, and access propaganda materials here.
                </p>
              </div>
              <button 
                onClick={() => setShowSubmitModal(true)}
                className="bg-secondary text-on-secondary border-2 border-on-surface px-4 py-2 font-label-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add_box</span>
                SUBMIT INTEL
              </button>
            </div>
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
                
                <div className="mt-4 space-y-6">
                  {homeworks.length === 0 && (
                    <div className="text-center p-4 border-2 border-dashed border-on-surface text-tertiary">
                      AWAITING CENTRAL INTELLIGENCE...
                    </div>
                  )}

                  {homeworks.map(task => {
                    const isComplete = completedTasks.includes(task.id);
                    return (
                      <div 
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className="flex flex-col xl:flex-row xl:items-center gap-4 p-4 border-2 border-on-surface bg-surface hover:bg-surface-variant transition-colors group cursor-pointer"
                      >
                        <div className={`flex-shrink-0 w-8 h-8 border-2 border-on-surface flex items-center justify-center transition-colors ${
                          isComplete ? 'bg-on-surface' : 'bg-surface-container-lowest group-hover:bg-primary-container'
                        }`}>
                          {isComplete && (
                            <span className="material-symbols-outlined text-surface-container-lowest font-bold">close</span>
                          )}
                        </div>
                        <div className={`flex-grow ${isComplete ? 'opacity-60 line-through' : ''}`}>
                          <h3 className="font-label-bold text-label-bold uppercase text-on-surface leading-tight">{task.subject}</h3>
                          <p className="font-body-md text-sm mt-1">{task.content}</p>
                          <p className="font-mono-style text-[10px] text-on-surface-variant mt-2 border-t border-on-surface pt-1">Due: {task.due_date}</p>
                        </div>
                        <div className={`flex-shrink-0 ${isComplete ? 'opacity-60' : ''}`}>
                          <span className={`font-mono-style text-[10px] sm:text-[10px] px-2 py-1 uppercase border border-on-surface inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            isComplete ? 'bg-secondary-container text-on-secondary-container' : 'bg-error text-on-error'
                          }`}>
                            {isComplete ? 'NEUTRALIZED' : task.priority || 'CRITICAL'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

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
                {intel.length === 0 && (
                   <li className="text-center p-4 border-2 border-dashed border-on-surface text-tertiary">
                     SCANNING FREQUENCIES...
                   </li>
                )}
                {intel.map((item, idx) => (
                  <li key={item.id} className={`border-l-4 pl-4 ${idx % 2 === 0 ? 'border-error' : 'border-primary'}`}>
                    <div className="font-mono-style text-mono-style text-on-surface-variant mb-1">{item.due_date}</div>
                    <h4 className="font-label-bold text-label-bold uppercase text-on-surface">{item.subject}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">{item.content}</p>
                    <div className="font-mono-style text-[8px] mt-2 uppercase text-tertiary">PRIORITY: {item.priority}</div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Poll of the Day */}
            <section className="bg-primary-container border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative overflow-hidden h-full flex flex-col justify-between text-left">
              <div className="absolute top-4 right-4 w-16 h-4 bg-on-surface"></div>
              <div className="absolute top-10 right-4 w-10 h-4 bg-on-surface"></div>
              
              <div>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary-container uppercase mb-2">THE VOX POPULI</h2>
                <p className="font-body-md text-body-md text-on-primary-fixed-variant mb-6 font-bold pr-16">
                  Is the cafeteria serving "mystery meat" again, or is it a deliberate attempt to test our gastrointestinal fortitude?
                </p>
              </div>

              {hasVoted ? (
                <div className="space-y-4 bg-surface p-4 border-2 border-on-surface bureaucratic-shadow">
                  <div className="font-mono-style text-[10px] text-tertiary uppercase">SECTOR OPINION INTAKE COMPLETED</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between font-label-bold text-label-bold mb-1">
                        <span>BIO-WEAPON</span>
                        <span>{pollResults.bioWeapon}%</span>
                      </div>
                      <div className="h-4 bg-surface-container border border-on-surface p-[2px]">
                        <div className="h-full bg-error" style={{ width: `${pollResults.bioWeapon}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-label-bold text-label-bold mb-1">
                        <span>PREMIUM PROTEIN</span>
                        <span>{pollResults.premiumProtein}%</span>
                      </div>
                      <div className="h-4 bg-surface-container border border-on-surface p-[2px]">
                        <div className="h-full bg-primary" style={{ width: `${pollResults.premiumProtein}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePollSubmit} className="space-y-3 bg-surface p-4 border-2 border-on-surface bureaucratic-shadow">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="poll" value="bio" className="peer sr-only" onChange={(e) => setSelectedPoll(e.target.value)} />
                    <div className="w-5 h-5 rounded-full border-2 border-on-surface flex items-center justify-center peer-checked:bg-on-surface peer-checked:border-on-surface transition-colors">
                      <div className="w-2 h-2 rounded-full bg-surface peer-checked:block hidden"></div>
                    </div>
                    <span className="font-label-bold text-label-bold uppercase group-hover:text-primary transition-colors">YES, IT'S A BIO-WEAPON.</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="poll" value="protein" className="peer sr-only" onChange={(e) => setSelectedPoll(e.target.value)} />
                    <div className="w-5 h-5 rounded-full border-2 border-on-surface flex items-center justify-center peer-checked:bg-on-surface peer-checked:border-on-surface transition-colors">
                      <div className="w-2 h-2 rounded-full bg-surface peer-checked:block hidden"></div>
                    </div>
                    <span className="font-label-bold text-label-bold uppercase group-hover:text-primary transition-colors">NO, IT'S PREMIUM PROTEIN.</span>
                  </label>

                  <button type="submit" disabled={!selectedPoll} className="w-full bg-on-surface text-surface py-3 font-label-bold text-label-bold uppercase mt-4 hover:bg-surface hover:text-on-surface border-2 border-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    SUBMIT RESPONSE
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Submit Intel Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border-4 border-on-surface shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-xl w-full p-8 relative">
            <button 
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-on-surface hover:text-error"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <h2 className="font-headline-lg text-headline-lg uppercase mb-6 border-b-2 border-on-surface pb-2">SUBMIT NEW INTEL</h2>
            
            <form onSubmit={handleMunitionSubmit} className="space-y-6">
              {submitError && (
                <div className="border-2 border-error bg-error-container p-4 text-on-error-container font-mono-style text-xs">
                  <span className="font-bold text-error block mb-1">SYSTEM WARNING:</span>
                  {submitError}
                </div>
              )}

              <div className="space-y-2">
                <label className="font-label-bold text-label-bold uppercase">CLASSIFICATION</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-on-surface p-3 flex-1 bg-surface has-[:checked]:bg-primary-container">
                    <input type="radio" name="type" value="HOMEWORK" checked={submitType === 'HOMEWORK'} onChange={e => setSubmitType(e.target.value)} className="hidden" />
                    <span className="material-symbols-outlined">folder_special</span>
                    <span className="font-label-bold uppercase text-sm">HOMEWORK</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-on-surface p-3 flex-1 bg-surface has-[:checked]:bg-error-container">
                    <input type="radio" name="type" value="EXAM_INTEL" checked={submitType === 'EXAM_INTEL'} onChange={e => setSubmitType(e.target.value)} className="hidden" />
                    <span className="material-symbols-outlined text-error">warning</span>
                    <span className="font-label-bold uppercase text-sm">EXAM INTEL</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-bold text-label-bold uppercase">SUBJECT / TOPIC</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Math: Quadratic Equations"
                  className="w-full bg-surface border-2 border-on-surface p-4 font-mono-style placeholder-tertiary outline-none focus:border-secondary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-bold text-label-bold uppercase">INTEL DETAILS</label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Provide the exact parameters of the assignment or exam warning..."
                  className="w-full bg-surface border-2 border-on-surface p-4 font-mono-style placeholder-tertiary outline-none focus:border-secondary min-h-[100px]"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary py-4 font-label-bold uppercase tracking-widest border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-70 disabled:cursor-wait"
              >
                {isSubmitting ? 'PROCESSING VIA CENTRAL INTELLIGENCE (AI)...' : 'UPLOAD TO DIRECTORATE'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
