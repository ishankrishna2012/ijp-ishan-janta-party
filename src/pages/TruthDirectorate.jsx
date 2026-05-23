import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function TruthDirectorate() {
  const { user, signOutOperative } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [targetSubject, setTargetSubject] = useState('');
  const [transgressionType, setTransgressionType] = useState('IDEOLOGICAL DEVIANCE');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Complaints history state
  const [myComplaints, setMyComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Fetch student's own complaints
  const fetchMyComplaints = async () => {
    if (!user) return;
    try {
      setLoadingComplaints(true);
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err.message);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [user]);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!targetSubject || !details) {
      setSubmitError('Incomplete dossier fields. Fill target subject and account details.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const { error } = await supabase
        .from('complaints')
        .insert({
          target_subject: targetSubject,
          transgression_type: transgressionType,
          details: details,
          user_id: user.id,
          user_unique_id: user.unique_id,
          status: 'PENDING'
        });

      if (error) throw error;

      setSubmitSuccess(true);
      setTargetSubject('');
      setDetails('');
      fetchMyComplaints(); // Refresh list
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for human-readable sector label
  const getSectorLabel = (sec) => {
    switch (sec) {
      case 'g9': return 'Sector 9 (Initiate)';
      case 'g10': return 'Sector 10 (Standard)';
      case 'g11': return 'Sector 11 (Advanced)';
      case 'g12': return 'Sector 12 (Vanguard)';
      default: return 'Sector 9 (Initiate)';
    }
  };

  // Helper for styling status chips
  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-primary-container text-on-primary-container';
      case 'APPROVED': return 'bg-secondary text-on-secondary';
      case 'UNDER_INVESTIGATION': return 'bg-primary text-on-primary';
      case 'REDACTED': return 'bg-error text-on-error';
      default: return 'bg-on-surface text-surface-container-lowest';
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col antialiased font-body-lg">
      <div className="scanlines"></div>
      
      {/* TopAppBar (Web Desktop) */}
      <nav className="bg-background dark:bg-on-background docked full-width top-0 border-b-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 hidden md:flex">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4">
          <div className="font-headline-lg text-headline-lg text-primary uppercase tracking-tighter cursor-pointer" onClick={() => navigate('/')}>IJP</div>
          <div className="flex space-x-8">
            <Link className="text-on-surface hover:text-primary font-label-bold text-label-bold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" to="/truth-directorate">MINISTRIES</Link>
            <Link className="text-primary border-b-2 border-primary pb-1 font-label-bold text-label-bold scale-95 transition-transform duration-100" to="/truth-directorate">PROPAGANDA</Link>
            <Link className="text-on-surface hover:text-primary font-label-bold text-label-bold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" to="/manifesto">MANIFESTO</Link>
          </div>
          <div className="flex gap-4">
            {user ? (
              <button 
                onClick={signOutOperative}
                className="bureaucratic-border bg-surface text-on-surface font-label-bold text-label-bold px-4 py-2 uppercase hard-shadow btn-press"
              >
                LOGOUT
              </button>
            ) : (
              <button 
                onClick={() => navigate('/signup')}
                className="bureaucratic-border bg-primary-container text-on-primary-container font-label-bold text-label-bold px-4 py-2 uppercase hard-shadow btn-press"
              >
                JOIN THE MOVEMENT
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-background border-b-2 border-on-surface p-4 flex justify-between items-center z-40 relative">
        <div className="font-headline-lg-mobile text-headline-lg-mobile text-primary uppercase tracking-tighter cursor-pointer" onClick={() => navigate('/')}>IJP</div>
        <button 
          onClick={signOutOperative}
          className="bureaucratic-border bg-primary text-on-primary px-3 py-1 font-label-bold text-label-bold uppercase hard-shadow"
        >
          LOGOUT
        </button>
      </header>

      {/* Main Layout: Side Nav + Content */}
      <div className="flex flex-1 relative z-10 w-full max-w-[container-max] mx-auto">
        
        {/* SideNavBar */}
        <aside className="hidden md:flex flex-col w-64 border-r-2 border-on-surface bg-surface-container-highest dark:bg-surface-dim h-full min-h-screen sticky top-0 p-4 shrink-0 text-left">
          <div className="mb-8 border-b-2 border-on-surface pb-4">
            <div className="w-16 h-16 bg-surface-variant bureaucratic-border mb-4 flex items-center justify-center overflow-hidden">
              <img 
                alt="IJP Directorate Seal" 
                className="w-full h-full object-cover grayscale opacity-80" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_thJwJgA_2GoOBID4u2NLF_Ebg2jApCTC6IcOBPfVP_QVWisbRWFJnCcritCAuNx1bJV3blZpIhxjoezmUI3EwpGJf-vcRPFYAAZE_FFXKUYukN6JY-m3JgHW90-KaP_0_rJUv0JzX6ntpcjTiiALBYy5oH-la4xABYYvK53gyhni4hoszV9TF148LqeH6lO9n6NIXpi7RPkBkpFC5zK87klz44lNJTUSzwpVuVGHyDO4-ptAbihS8zMierhXuLyltJyDLI2jvQ"
              />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase leading-none truncate">{user?.codename}</h2>
            <p className="font-mono-style text-mono-style text-primary mt-2 uppercase tracking-widest text-xs">
              ID: {user?.unique_id}
            </p>
          </div>
          <nav className="flex-1 space-y-2">
            <Link className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-variant font-label-bold text-label-bold uppercase hover:bg-primary-container hover:text-on-primary-container transition-colors bureaucratic-border border-transparent hover:border-on-surface hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" to="/student-hub">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <span>Grade 9 Hub</span>
            </Link>
            <Link className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-variant font-label-bold text-label-bold uppercase hover:bg-primary-container hover:text-on-primary-container transition-colors bureaucratic-border border-transparent hover:border-on-surface hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" to="/truth-directorate">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              <span>Homework Tracker</span>
            </Link>
            <Link className="flex items-center space-x-3 p-3 bg-secondary-container text-on-secondary-container border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-label-bold text-label-bold uppercase translate-x-1 duration-75" to="/truth-directorate">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
              <span>Reporting Tools</span>
            </Link>
            {user?.role === 'admin' && (
              <Link className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-variant font-label-bold text-label-bold uppercase hover:bg-primary-container hover:text-on-primary-container transition-colors bureaucratic-border border-transparent hover:border-on-surface hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" to="/admin">
                <span className="material-symbols-outlined">gavel</span>
                <span>ADMIN PANEL</span>
              </Link>
            )}
          </nav>
          <div className="mt-auto pt-8 border-t-2 border-on-surface">
            <button 
              onClick={signOutOperative}
              className="w-full bg-primary text-on-primary font-label-bold text-label-bold p-3 uppercase bureaucratic-border hard-shadow btn-press hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow px-margin-mobile md:px-margin-desktop py-8 md:py-12 space-y-16 text-left">
          
          {/* Page Header */}
          <header className="border-b-4 border-on-surface pb-6 mb-12">
            <p className="font-mono-style text-mono-style uppercase text-primary tracking-widest mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">visibility</span>
              CLASSIFIED DOSSIER #849-B // SECTOR: {user?.sector.toUpperCase()}
            </p>
            <h1 className="font-display-lg text-headline-xl md:text-display-lg uppercase tracking-tighter text-on-background glitch-hover inline-block">THE TRUTH DIRECTORATE</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-2xl border-l-4 border-primary pl-4">
              Submit anonymous reports, consume state-sanctioned narratives, and distribute approved digital munitions. Compliance is mandatory.
            </p>
          </header>

          {/* Section 1: Anonymous Complaint Portal + Submissions History */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COMPLAINT SUBMISSION FORM */}
            <div className="lg:col-span-5 bg-surface-container-highest p-6 md:p-8 bureaucratic-border hard-shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-on-primary font-mono-style text-mono-style px-3 py-1 bureaucratic-border border-t-0 border-r-0">FORM-TR-01</div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg uppercase tracking-tight text-on-surface mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
                ANONYMOUS REPORT
              </h2>
              
              <form onSubmit={handleSubmitComplaint} className="space-y-6 relative z-10">
                {submitSuccess && (
                  <div className="border-2 border-secondary bg-secondary-container/20 p-4 bureaucratic-shadow text-xs font-mono-style uppercase text-secondary flex items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    Report submitted successfully. Monitoring channel live.
                  </div>
                )}
                
                {submitError && (
                  <div className="border-2 border-error bg-error-container p-4 bureaucratic-shadow text-xs font-mono-style uppercase text-error flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block font-label-bold text-label-bold uppercase text-on-surface mb-2">Subject of Inquiry</label>
                  <input 
                    className="w-full bg-surface-lowest bureaucratic-border p-3 font-mono-style text-mono-style uppercase focus:outline-none focus:border-secondary focus:ring-0 transition-colors" 
                    placeholder="ENTER TARGET ID OR NAME" 
                    type="text"
                    required
                    value={targetSubject}
                    onChange={(e) => setTargetSubject(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block font-label-bold text-label-bold uppercase text-on-surface mb-2">Nature of Transgression</label>
                  <select 
                    className="w-full bg-surface-lowest bureaucratic-border p-3 font-mono-style text-mono-style uppercase focus:outline-none focus:border-secondary focus:ring-0 transition-colors appearance-none"
                    value={transgressionType}
                    onChange={(e) => setTransgressionType(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="IDEOLOGICAL DEVIANCE">IDEOLOGICAL DEVIANCE</option>
                    <option value="UNAUTHORIZED MEME DISTRIBUTION">UNAUTHORIZED MEME DISTRIBUTION</option>
                    <option value="FAILURE TO SUBMIT HOMEWORK">FAILURE TO SUBMIT HOMEWORK</option>
                    <option value="OTHER (SPECIFY IN DETAILS)">OTHER (SPECIFY IN DETAILS)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-bold text-label-bold uppercase text-on-surface mb-2">Detailed Account</label>
                  <textarea 
                    className="w-full bg-surface-lowest bureaucratic-border p-3 font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-0 transition-colors" 
                    placeholder="Provide actionable intelligence..." 
                    rows="4"
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-error-container border-2 border-error">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <p className="font-mono-style text-mono-style text-on-error-container text-[11px] uppercase leading-tight">
                    Falsifying reports is a Class-3 offense punishable by immediate suspension.
                  </p>
                </div>
                
                <button 
                  className="w-full bg-on-surface text-on-primary font-headline-lg-mobile text-headline-lg-mobile py-4 uppercase bureaucratic-border hard-shadow btn-press hover:bg-primary transition-colors flex justify-center items-center gap-2 disabled:opacity-70" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'TRANSMITTING...' : 'SUBMIT TO DIRECTORATE'}
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>

            {/* MY SUBMITTED COMPLAINTS DOSSIERS */}
            <div className="lg:col-span-7 bg-on-background/5 p-6 border-2 border-on-surface bureaucratic-shadow relative min-h-[400px] flex flex-col">
              <div className="border-b-2 border-on-surface pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-label-bold text-label-bold uppercase text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined">folder_shared</span>
                  My Logged Transgressions ({myComplaints.length})
                </h3>
                <span className="font-mono-style text-[10px] text-tertiary">CONFIDENTIAL LOGS</span>
              </div>

              {loadingComplaints ? (
                <div className="flex-grow flex items-center justify-center flex-col py-12">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-2">radar</span>
                  <span className="font-mono-style text-xs text-on-surface-variant uppercase">Retrieving locked records...</span>
                </div>
              ) : myComplaints.length === 0 ? (
                <div className="flex-grow flex flex-col justify-center items-center text-center p-8 border-4 border-on-surface/30 border-dashed">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">inbox</span>
                  <h4 className="font-label-bold text-label-bold uppercase text-on-surface mb-2">No Reports Filed</h4>
                  <p className="font-body-md text-sm text-on-surface-variant max-w-xs">
                    Your loyalty file is clear. Submit actionable intelligence in the report console to secure the collective.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {myComplaints.map(complaint => (
                    <div key={complaint.id} className="border-2 border-on-surface bg-surface p-4 relative bureaucratic-shadow hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-mono-style text-[9px] px-2 py-0.5 uppercase border border-on-surface font-bold ${getStatusStyle(complaint.status)}`}>
                          {complaint.status}
                        </span>
                        <span className="font-mono-style text-[10px] text-tertiary">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="font-label-bold text-label-bold text-on-surface uppercase truncate mt-1">
                        INQUIRY TARGET: <strong className="text-primary font-bold">{complaint.target_subject}</strong>
                      </h4>
                      <p className="font-mono-style text-[10px] text-on-surface-variant uppercase mt-0.5">
                        Transgression: {complaint.transgression_type}
                      </p>
                      
                      <p className="font-body-md text-sm text-on-surface-variant bg-surface-container-lowest p-2 border border-on-surface/20 mt-3 whitespace-pre-wrap">
                        {complaint.details}
                      </p>

                      {/* Admin Response Section */}
                      {complaint.response ? (
                        <div className="mt-3 bg-secondary-container/20 border-2 border-secondary p-3 text-xs">
                          <div className="font-label-bold text-[10px] text-on-secondary-container uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                            DIRECTORATE OFFICIAL RESPONSE:
                          </div>
                          <p className="font-mono-style text-on-secondary-container mt-1 font-bold whitespace-pre-wrap">
                            {complaint.response}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 bg-surface-container border border-on-surface/20 p-2 text-[10px] font-mono-style text-tertiary uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                          Awaiting official review. The central core has logged your filing.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

          {/* Section 2: The Ministry Newsroom */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b-2 border-on-surface pb-4">
              <h2 className="font-headline-lg text-headline-lg md:text-headline-xl uppercase tracking-tighter">THE MINISTRY NEWSROOM</h2>
              <a className="font-mono-style text-mono-style text-primary hover:underline uppercase hidden md:block" href="#">VIEW ALL PROPAGANDA</a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Article Card 1 */}
              <article className="bg-surface bureaucratic-border hard-shadow group cursor-pointer relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 left-0 bg-secondary text-on-secondary font-mono-style text-mono-style px-2 py-1 z-10 bureaucratic-border border-t-0 border-l-0">APPROVED</div>
                <div className="h-48 overflow-hidden border-b-2 border-on-surface bg-on-surface">
                  <img 
                    alt="News Image" 
                    className="w-full h-full object-cover grayscale mix-blend-multiply opacity-80 group-hover:scale-110 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe36SRgvTQy6kswZKwdDf0AZEdSETy2yZYuJ0sIK8tb7Kbre8T1MCZKLnP4yS1Q01-rpEHJVo4L5sKFfa1DL1plH7lDbqIeWEUckABIGoFQCnVBzJlGjen_JaIF-D638RC3CMqLij7l1GDCZzPTQ8LZcdIxOK1RZDFHUlcF3YsZpefKITYnOnPp0IxthI2kqLhlnxB59sdeIdnyPlXBAnsmEu03rZFwX_9WX3U-tFrP4FmulpuqfeS9oSmw_eGQXobHWXt651HIQ"
                  />
                </div>
                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile uppercase tracking-tight leading-none mb-3 group-hover:text-primary transition-colors">NEW CURRICULUM MANDATE ISSUED</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant flex-1 line-clamp-3 mb-4">
                    The Ministry of Education announces immediate implementation of the revised historical syllabus. All prior textbooks are to be surrendered to the nearest processing center.
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-surface-dim">
                    <span className="font-mono-style text-mono-style text-tertiary text-[10px]">AUTHOR: IJP-CENTRAL</span>
                    <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              </article>

              {/* Article Card 2 */}
              <article className="bg-surface bureaucratic-border hard-shadow group cursor-pointer relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 left-0 bg-error text-on-error font-mono-style text-mono-style px-2 py-1 z-10 bureaucratic-border border-t-0 border-l-0">MANDATORY READING</div>
                <div className="h-48 overflow-hidden border-b-2 border-on-surface bg-primary-container">
                  <img 
                    alt="News Image" 
                    className="w-full h-full object-cover mix-blend-luminosity opacity-70 group-hover:scale-110 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZ1qCwG-vZEqgh_-vSZ3Q9_nedzsCDYlu8pP7R0Y5j3h0fkbNwY63YspVvNnqh73z5a6XEFsfwnDd0BxlFxs3e03t6oY6w2G4WzTJM-JLPKC6GDJceAq2YoPyQ4VmJCylGjaBnvyl7y59pgLxuGKhejZa-_Eb05cuVJeIH6jthZQCpEmcxZ0dqrs4gv1zhSs1DHSJTB84xj87ard_UYCL6r9k1wawPV8VCFxFWDq4l_fn5AMiZesiCFxoudjfH-soUEA5S69-S7g"
                  />
                </div>
                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile uppercase tracking-tight leading-none mb-3 group-hover:text-primary transition-colors">ATTENDANCE QUOTAS EXCEEDED</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant flex-1 line-clamp-3 mb-4">
                    Sector 4 reports 110% compliance in morning assemblies. The Directorate rewards Sector 4 with an extra 5 minutes of sanctioned leisure time.
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-surface-dim">
                    <span className="font-mono-style text-mono-style text-tertiary text-[10px]">AUTHOR: MIN-STATISTICS</span>
                    <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              </article>

              {/* Article Card 3 */}
              <article className="bg-surface-container-highest bureaucratic-border hard-shadow group cursor-pointer relative overflow-hidden flex flex-col h-full md:col-span-2 lg:col-span-1">
                <div className="p-5 flex-1 flex flex-col justify-center items-center text-center border-4 border-on-surface m-2 border-dashed">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">block</span>
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile uppercase tracking-tight text-on-surface-variant mb-2">CONTENT REDACTED</h3>
                  <p className="font-mono-style text-mono-style bg-on-surface text-on-primary px-2 py-1">CLEARANCE LEVEL NOT MET</p>
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-on-tertiary-fixed dark:bg-surface-container-lowest w-full py-8 px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter border-t-2 border-on-surface relative z-40">
        <div className="text-left">
          <div className="font-headline-xl text-headline-xl text-primary uppercase tracking-tighter mb-4 cursor-pointer" onClick={() => navigate('/')}>IJP</div>
          <p className="font-mono-style text-mono-style uppercase text-tertiary-fixed-dim">© 1984 ISHAN JANTA PARTY. ALL TRUTHS RESERVED.</p>
        </div>
        <div className="flex flex-col md:items-end justify-center space-y-2">
          <Link className="font-mono-style text-mono-style uppercase text-tertiary-fixed-dim hover:text-primary hover:bg-primary hover:text-on-primary px-2 transition-all inline-block w-fit" to="/truth-directorate">LEGAL LIES</Link>
          <Link className="font-mono-style text-mono-style uppercase text-tertiary-fixed-dim hover:text-primary hover:bg-primary hover:text-on-primary px-2 transition-all inline-block w-fit" to="/truth-directorate">PRIVACY ILLUSION</Link>
          <Link className="font-mono-style text-mono-style uppercase text-tertiary-fixed-dim hover:text-primary hover:bg-primary hover:text-on-primary px-2 transition-all inline-block w-fit" to="/student-hub">STUDENT PORTAL</Link>
        </div>
      </footer>
    </div>
  );
}
