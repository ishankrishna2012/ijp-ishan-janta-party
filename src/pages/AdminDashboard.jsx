import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const { user, signOutOperative } = useAuth();
  const navigate = useNavigate();

  // Dynamic Metrics state
  const [metrics, setMetrics] = useState({
    totalRecruits: 0,
    pendingComplaints: 0,
    approvedComplaints: 0,
    redactedComplaints: 0,
    unverifiedCount: 0
  });

  // DB Data States
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  
  // UI Loading/Filter States
  const [activeTab, setActiveTab] = useState('COMPLAINTS'); // COMPLAINTS, OPERATIVES
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');

  // Selected Complaint for Edit
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatus, setEditStatus] = useState('PENDING');
  const [editResponse, setEditResponse] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // ID Card viewer
  const [viewingIdCard, setViewingIdCard] = useState(null);
  const [idCardSignedUrl, setIdCardSignedUrl] = useState(null);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch complaints and their profiles (joined)
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          *,
          profiles (
            codename,
            unique_id,
            sector,
            section
          )
        `)
        .order('created_at', { ascending: false });

      if (complaintsError) throw complaintsError;

      // 2. Fetch users/profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setComplaints(complaintsData || []);
      setUsers(usersData || []);

      // 3. Compute Metrics
      const totalR = usersData?.length || 0;
      const pendingC = complaintsData?.filter(c => c.status === 'PENDING').length || 0;
      const approvedC = complaintsData?.filter(c => c.status === 'APPROVED').length || 0;
      const redactedC = complaintsData?.filter(c => c.status === 'REDACTED').length || 0;
      const unverified = usersData?.filter(u => !u.verified).length || 0;

      setMetrics({
        totalRecruits: totalR,
        pendingComplaints: pendingC,
        approvedComplaints: approvedC,
        redactedComplaints: redactedC,
        unverifiedCount: unverified
      });

    } catch (err) {
      console.error('Error fetching dashboard records:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Realtime subscriptions
  useEffect(() => {
    const complaintsChannel = supabase
      .channel('admin-complaints-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [fetchDashboardData]);

  // Update Complaint Status/Response Handler
  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: editStatus,
          response: editResponse
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      setUpdateSuccess(true);
      
      // Update local item
      setSelectedComplaint(prev => ({
        ...prev,
        status: editStatus,
        response: editResponse
      }));

      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);

    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle Verification Status
  const handleToggleVerification = async (userId, currentStatus, userCodename) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'VERIFY' : 'UNVERIFY';
    const confirm = window.confirm(`${action} operative "${userCodename}"?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: newStatus })
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      alert(`Verification update failed: ${err.message}`);
    }
  };

  // Promote Student to Admin Handler
  const handlePromoteUser = async (userId, userCodename) => {
    const confirm = window.confirm(`Are you absolutely sure you want to promote operative "${userCodename}" to Supreme Admin?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

      if (error) throw error;
      alert(`Operative "${userCodename}" has been elevated to Admin status.`);
    } catch (err) {
      alert(`Promotion failed: ${err.message}`);
    }
  };

  // View ID Card — generate signed URL
  const handleViewIdCard = async (idCardUrl, userCodename) => {
    if (!idCardUrl) {
      alert('No identity document uploaded by this operative.');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('id-cards')
        .createSignedUrl(idCardUrl, 300); // 5 min expiry

      if (error) throw error;

      setViewingIdCard(userCodename);
      setIdCardSignedUrl(data.signedUrl);
    } catch (err) {
      alert(`Failed to retrieve ID card: ${err.message}`);
    }
  };

  // Filter complaints based on status
  const filteredComplaints = complaints.filter(c => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  // Filter users based on query and section
  const filteredUsers = users.filter(u => {
    const query = userSearchQuery.toLowerCase();
    const matchesQuery = (
      u.codename.toLowerCase().includes(query) ||
      u.unique_id.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.d_no && u.d_no.toLowerCase().includes(query))
    );
    const matchesSection = sectionFilter === 'ALL' || u.section === sectionFilter;
    return matchesQuery && matchesSection;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-primary-container text-on-primary-container';
      case 'APPROVED': return 'bg-secondary text-on-secondary';
      case 'UNDER_INVESTIGATION': return 'bg-primary text-on-primary';
      case 'REDACTED': return 'bg-error text-on-error';
      default: return 'bg-on-surface text-surface-container-lowest';
    }
  };

  const getSectionLabel = (sec) => `Division ${sec}`;

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen overflow-x-hidden selection:bg-primary selection:text-on-primary relative flex">
      {/* Scanline background */}
      <div className="scanlines"></div>

      {/* ID Card Viewer Modal */}
      {viewingIdCard && idCardSignedUrl && (
        <div className="fixed inset-0 bg-on-surface/80 z-[100] flex items-center justify-center p-4" onClick={() => { setViewingIdCard(null); setIdCardSignedUrl(null); }}>
          <div className="bg-surface-container-lowest border-2 border-on-surface bureaucratic-shadow max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 bg-error text-on-error font-mono-style text-mono-style px-3 py-1 border-l-2 border-b-2 border-on-surface">CLASSIFIED</div>
            <h3 className="font-headline-lg-mobile uppercase text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
              ID CARD: {viewingIdCard}
            </h3>
            <div className="border-2 border-on-surface overflow-hidden bg-surface">
              <img src={idCardSignedUrl} alt={`ID Card for ${viewingIdCard}`} className="w-full h-auto max-h-[60vh] object-contain" />
            </div>
            <button 
              onClick={() => { setViewingIdCard(null); setIdCardSignedUrl(null); }}
              className="mt-4 w-full bg-on-surface text-surface-container-lowest font-label-bold text-label-bold uppercase py-3 border-2 border-on-surface bureaucratic-shadow btn-press"
            >
              CLOSE DOSSIER
            </button>
          </div>
        </div>
      )}

      {/* SideNavBar */}
      <nav className="hidden md:flex bg-surface-container-highest dark:bg-surface-dim h-screen w-64 border-r-2 border-on-surface fixed left-0 top-0 flex-col p-4 z-40 text-left">
        <div className="mb-8 flex flex-col items-start gap-4">
          <div className="w-16 h-16 bg-primary border-2 border-on-surface flex items-center justify-center rounded-DEFAULT shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-on-primary text-4xl">gavel</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tighter leading-none cursor-pointer" onClick={() => navigate('/')}>IJP</h1>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase tracking-tight leading-none mt-1">ADMIN HQ</h2>
            <p className="font-mono-style text-mono-style uppercase text-primary mt-2 border-b-2 border-on-surface pb-1 inline-block">
              SUPREME PANEL
            </p>
          </div>
        </div>

        <div className="mb-6 bg-surface p-3 border-2 border-on-surface text-xs font-mono-style uppercase">
          <div className="text-tertiary">ADMIN CODENAME:</div>
          <div className="font-bold text-on-surface text-sm truncate">{user?.codename}</div>
          <div className="text-tertiary mt-2">ACCESS CLEARANCE:</div>
          <div className="font-bold text-error text-xs">LEVEL 9 LEADER</div>
        </div>

        <ul className="flex flex-col gap-2 flex-grow">
          <li>
            <button 
              onClick={() => setActiveTab('COMPLAINTS')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all ${
                activeTab === 'COMPLAINTS' 
                  ? 'bg-secondary-container text-on-secondary-container border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-1' 
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface border-transparent'
              }`}
            >
              <span className="material-symbols-outlined">folder_open</span>
              Complaints Dossier
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('OPERATIVES')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all ${
                activeTab === 'OPERATIVES' 
                  ? 'bg-secondary-container text-on-secondary-container border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-1' 
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface border-transparent'
              }`}
            >
              <span className="material-symbols-outlined">groups</span>
              Cadre Operatives
            </button>
          </li>
          <li className="mt-4 pt-4 border-t-2 border-on-surface border-dashed">
            <Link className="flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase text-on-surface hover:text-primary" to="/comms-link">
              <span className="material-symbols-outlined">satellite_alt</span>
              SECURE COMMS LINK
            </Link>
          </li>
          <li className="mt-4 pt-4 border-t-2 border-on-surface border-dashed">
            <Link className="flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase text-on-surface hover:text-primary" to="/student-hub">
              <span className="material-symbols-outlined">school</span>
              Student Hub View
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase text-on-surface hover:text-primary" to="/truth-directorate">
              <span className="material-symbols-outlined">campaign</span>
              Truth Directorate
            </Link>
          </li>
        </ul>
        
        <div className="mt-auto pt-8">
          <button 
            onClick={signOutOperative}
            className="w-full bg-primary text-on-primary font-label-bold text-label-bold uppercase py-3 px-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            SYSTEM SHUTDOWN
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 pt-6 md:pt-0 min-h-screen relative pb-32 text-left">
        <div className="px-margin-mobile md:px-margin-desktop py-12 max-w-[container-max] mx-auto flex flex-col gap-gutter">
          
          {/* Header */}
          <header className="border-b-4 border-on-surface pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-mono-style text-mono-style uppercase text-error tracking-widest mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-pulse">radar</span>
                LIVE // OFFICIAL ADMIN CONSOLE
              </p>
              <h1 className="font-display-lg text-headline-xl md:text-display-lg text-on-surface uppercase tracking-tighter leading-none">IJP HEADQUARTERS</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
                Manage reports of disloyalty, catalog operative enlistments, and execute status decrees.
              </p>
            </div>
            <div className="stamp text-xl border-error text-error font-headline-lg bg-surface">SUPREME CONTROL</div>
          </header>

          {/* Quick Metrics Bar */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-surface-container-lowest border-2 border-on-surface p-4 bureaucratic-shadow">
              <div className="font-mono-style text-[10px] text-tertiary uppercase">TOTAL CADRE OPERATIVES</div>
              <div className="font-headline-lg text-4xl text-on-surface mt-1">{metrics.totalRecruits}</div>
            </div>
            <div className="bg-primary-container border-2 border-on-surface p-4 bureaucratic-shadow">
              <div className="font-mono-style text-[10px] text-on-primary-container uppercase">PENDING INVESTIGATIONS</div>
              <div className="font-headline-lg text-4xl text-on-primary-container mt-1">{metrics.pendingComplaints}</div>
            </div>
            <div className="bg-secondary-container border-2 border-on-surface p-4 bureaucratic-shadow">
              <div className="font-mono-style text-[10px] text-on-secondary-container uppercase">NEUTRALIZED THREATS</div>
              <div className="font-headline-lg text-4xl text-on-secondary-container mt-1">{metrics.approvedComplaints}</div>
            </div>
            <div className="bg-error-container border-2 border-on-surface p-4 bureaucratic-shadow">
              <div className="font-mono-style text-[10px] text-on-error-container uppercase">REDACTED TRANSACTIONS</div>
              <div className="font-headline-lg text-4xl text-on-error-container mt-1">{metrics.redactedComplaints}</div>
            </div>
            <div className="bg-surface-variant border-2 border-on-surface p-4 bureaucratic-shadow">
              <div className="font-mono-style text-[10px] text-on-surface-variant uppercase">UNVERIFIED OPERATIVES</div>
              <div className="font-headline-lg text-4xl text-on-surface mt-1">{metrics.unverifiedCount}</div>
            </div>
          </section>

          {/* Table / Grid content based on Active Tab */}
          {activeTab === 'COMPLAINTS' ? (
            /* COMPLAINTS TAB */
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Complaints list */}
              <div className="lg:col-span-7 bg-surface-container-highest p-6 border-2 border-on-surface bureaucratic-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-on-surface pb-4 mb-6">
                  <h2 className="font-headline-lg-mobile uppercase text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined">folder_shared</span>
                    Transgression Dossiers ({filteredComplaints.length})
                  </h2>
                  <div className="flex gap-2">
                    <select 
                      className="border-2 border-on-surface bg-surface p-2 font-mono-style text-xs uppercase"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">ALL STATUSES</option>
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
                      <option value="REDACTED">REDACTED</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="py-24 text-center">
                    <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block">radar</span>
                    <span className="font-mono-style text-xs uppercase">Polling database logs...</span>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="py-16 text-center border-4 border-on-surface/20 border-dashed m-4">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">check_circle</span>
                    <h3 className="font-label-bold text-label-bold uppercase text-on-surface">No Deviancy Logged</h3>
                    <p className="font-mono-style text-xs text-on-surface-variant mt-1">All operatives are currently fully compliant.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {filteredComplaints.map(complaint => (
                      <div 
                        key={complaint.id}
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setEditStatus(complaint.status);
                          setEditResponse(complaint.response || '');
                          setUpdateSuccess(false);
                          setUpdateError(null);
                        }}
                        className={`border-2 p-4 text-left cursor-pointer transition-all bureaucratic-shadow hover:-translate-x-[2px] hover:-translate-y-[2px] ${
                          selectedComplaint?.id === complaint.id 
                            ? 'bg-primary-container/10 border-primary shadow-[4px_4px_0px_0px_#8f4e00]' 
                            : 'bg-surface border-on-surface'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`font-mono-style text-[9px] px-2 py-0.5 uppercase border border-on-surface font-bold ${getStatusStyle(complaint.status)}`}>
                            {complaint.status}
                          </span>
                          <span className="font-mono-style text-[10px] text-tertiary">
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-label-bold text-label-bold text-on-surface uppercase mt-2 truncate">
                          TARGET: <strong className="text-primary font-bold">{complaint.target_subject}</strong>
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] font-mono-style text-on-surface-variant uppercase">
                          <span>TYPE: {complaint.transgression_type}</span>
                          <span>SUBMITTED BY: {complaint.profiles?.codename || 'ANONYMOUS'} ({complaint.user_unique_id})</span>
                          {complaint.profiles?.section && (
                            <span>SECTION: {complaint.profiles.section}</span>
                          )}
                        </div>
                        
                        <p className="font-body-md text-sm text-on-surface-variant mt-3 bg-surface-container-lowest p-2 border border-on-surface/10 line-clamp-2">
                          {complaint.details}
                        </p>

                        {complaint.response && (
                          <div className="mt-2 text-[10px] font-mono-style text-secondary uppercase bg-secondary-container/10 p-1.5 border border-secondary/30 truncate">
                            <strong>ACTION DECREE:</strong> {complaint.response}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit Complaint Panel */}
              <div className="lg:col-span-5 bg-surface-container-lowest p-6 border-2 border-on-surface bureaucratic-shadow relative">
                <div className="absolute top-0 right-0 bg-error text-on-error font-mono-style text-mono-style px-3 py-1 bureaucratic-border border-t-0 border-r-0">DECREE-TR-09</div>
                <h2 className="font-headline-lg-mobile uppercase text-on-surface mb-6 flex items-center gap-2 border-b-2 border-on-surface pb-3">
                  <span className="material-symbols-outlined">edit_document</span>
                  EXECUTIVE RESOLUTION
                </h2>

                {selectedComplaint ? (
                  <form onSubmit={handleUpdateComplaint} className="space-y-6">
                    {updateSuccess && (
                      <div className="border-2 border-secondary bg-secondary-container/20 p-4 text-xs font-mono-style uppercase text-secondary flex items-center gap-2">
                        <span className="material-symbols-outlined">check_circle</span>
                        Dossier status updated in central core!
                      </div>
                    )}
                    
                    {updateError && (
                      <div className="border-2 border-error bg-error-container p-4 text-xs font-mono-style uppercase text-error flex items-center gap-2">
                        <span className="material-symbols-outlined">warning</span>
                        {updateError}
                      </div>
                    )}

                    <div className="text-sm font-mono-style uppercase space-y-2 bg-surface p-3 border border-on-surface/20">
                      <div><strong className="text-tertiary">INQUIRY TARGET:</strong> {selectedComplaint.target_subject}</div>
                      <div><strong className="text-tertiary">TRANSGRESSION:</strong> {selectedComplaint.transgression_type}</div>
                      <div><strong className="text-tertiary">FILED BY:</strong> {selectedComplaint.profiles?.codename || 'ANONYMOUS'} ({selectedComplaint.user_unique_id})</div>
                      {selectedComplaint.profiles?.section && (
                        <div><strong className="text-tertiary">SECTION:</strong> Division {selectedComplaint.profiles.section}</div>
                      )}
                      <div className="pt-2 border-t border-on-surface/10">
                        <strong className="text-tertiary block mb-1">EVIDENCE DETAILS:</strong>
                        <p className="font-body-md text-xs text-on-surface-variant normal-case bg-surface-container-lowest p-2 border border-on-surface/10 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {selectedComplaint.details}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block font-label-bold text-label-bold uppercase text-on-surface mb-2">Decree Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['PENDING', 'APPROVED', 'UNDER_INVESTIGATION', 'REDACTED'].map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setEditStatus(status)}
                            className={`py-2 px-3 border-2 border-on-surface text-[10px] font-mono-style uppercase font-bold transition-all ${
                              editStatus === status 
                                ? 'bg-on-surface text-surface-lowest bureaucratic-shadow translate-x-[1px] translate-y-[1px]' 
                                : 'bg-surface text-on-surface hover:bg-surface-variant'
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-label-bold text-label-bold uppercase text-on-surface mb-2">Directorate Response & Action Note</label>
                      <textarea
                        className="w-full bg-surface border-2 border-on-surface p-3 font-mono-style text-xs uppercase focus:outline-none focus:border-secondary focus:ring-0"
                        placeholder="ENTER RESOLUTION MANDATES OR ACTION DECREES..."
                        rows="5"
                        required
                        value={editResponse}
                        onChange={(e) => setEditResponse(e.target.value)}
                        disabled={isUpdating}
                      ></textarea>
                    </div>

                    <button
                      className="w-full bg-primary text-on-primary font-headline-lg-mobile text-headline-lg-mobile py-4 uppercase border-2 border-on-surface hard-shadow btn-press disabled:opacity-75"
                      type="submit"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'DECREEING...' : 'PUBLISH DECREE'}
                    </button>
                  </form>
                ) : (
                  <div className="py-24 text-center border-4 border-dashed border-on-surface/30">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-2">open_in_new</span>
                    <h3 className="font-label-bold text-label-bold uppercase text-on-surface-variant">No Dossier Selected</h3>
                    <p className="font-mono-style text-xs text-on-surface-variant mt-1">Select an Operative Transgression to write a decree.</p>
                  </div>
                )}
              </div>

            </section>
          ) : (
            /* OPERATIVES (USERS) TAB */
            <section className="bg-surface-container-highest p-6 border-2 border-on-surface bureaucratic-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-on-surface pb-4 mb-6">
                <h2 className="font-headline-lg-mobile uppercase text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined">groups</span>
                  Registered Cadre Operatives ({filteredUsers.length})
                </h2>
                <div className="flex gap-2">
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="SEARCH CODENAME, EMAIL, ID, D-NO..."
                      className="w-full border-2 border-on-surface bg-surface p-2 pl-10 font-mono-style text-xs uppercase focus:outline-none"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface text-sm">search</span>
                  </div>
                  <select
                    className="border-2 border-on-surface bg-surface p-2 font-mono-style text-xs uppercase"
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                  >
                    <option value="ALL">ALL SECTIONS</option>
                    {['A','B','C','D','E','F','G','H','I','J'].map(s => (
                      <option key={s} value={s}>DIVISION {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block">radar</span>
                  <span className="font-mono-style text-xs uppercase">Fetching Operative Rolls...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center border-4 border-dashed border-on-surface/20 m-4">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">search_off</span>
                  <h3 className="font-label-bold text-label-bold uppercase text-on-surface">No Operatives Found</h3>
                  <p className="font-mono-style text-xs text-on-surface-variant mt-1">No results matching your query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-on-surface font-mono-style text-xs text-left">
                    <thead className="bg-on-surface text-surface-container-lowest uppercase border-b-2 border-on-surface">
                      <tr>
                        <th className="p-3 border-r-2 border-on-surface">UNIQUE ID</th>
                        <th className="p-3 border-r-2 border-on-surface">CODENAME</th>
                        <th className="p-3 border-r-2 border-on-surface">EMAIL</th>
                        <th className="p-3 border-r-2 border-on-surface">SECTION</th>
                        <th className="p-3 border-r-2 border-on-surface">D-NO</th>
                        <th className="p-3 border-r-2 border-on-surface">VERIFIED</th>
                        <th className="p-3 border-r-2 border-on-surface">ROLE</th>
                        <th className="p-3">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y-2 divide-on-surface">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-surface-variant transition-colors">
                          <td className="p-3 border-r-2 border-on-surface font-bold text-primary">{u.unique_id}</td>
                          <td className="p-3 border-r-2 border-on-surface uppercase font-bold">{u.codename}</td>
                          <td className="p-3 border-r-2 border-on-surface normal-case">{u.email}</td>
                          <td className="p-3 border-r-2 border-on-surface uppercase">{getSectionLabel(u.section)}</td>
                          <td className="p-3 border-r-2 border-on-surface">{u.d_no || '—'}</td>
                          <td className="p-3 border-r-2 border-on-surface text-center">
                            <button
                              onClick={() => handleToggleVerification(u.id, u.verified, u.codename)}
                              className={`px-2 py-0.5 border border-on-surface text-[10px] font-bold uppercase transition-all btn-press ${
                                u.verified 
                                  ? 'bg-secondary text-on-secondary' 
                                  : 'bg-error-container text-on-error-container'
                              }`}
                            >
                              {u.verified ? '✓ VERIFIED' : '✗ UNVERIFIED'}
                            </button>
                          </td>
                          <td className="p-3 border-r-2 border-on-surface uppercase font-bold text-center">
                            <span className={`px-2 py-0.5 border border-on-surface text-[10px] font-bold ${
                              u.role === 'admin' ? 'bg-error text-on-error' : 'bg-surface-dim text-on-surface'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col gap-1">
                              {u.id_card_url && (
                                <button
                                  onClick={() => handleViewIdCard(u.id_card_url, u.codename)}
                                  className="bg-surface-variant text-on-surface font-label-bold text-[10px] uppercase border border-on-surface py-1 px-2 btn-press transition-all hover:bg-primary-container flex items-center gap-1 justify-center"
                                >
                                  <span className="material-symbols-outlined text-xs">badge</span>
                                  VIEW ID
                                </button>
                              )}
                              {u.role === 'student' ? (
                                <button
                                  onClick={() => handlePromoteUser(u.id, u.codename)}
                                  className="bg-primary-container text-on-primary-container font-label-bold text-[10px] uppercase border border-on-surface py-1 px-2 bureaucratic-shadow btn-press font-bold transition-all hover:bg-primary hover:text-on-primary"
                                >
                                  PROMOTE ADMIN
                                </button>
                              ) : (
                                <span className="text-secondary font-bold text-[10px] uppercase flex items-center justify-center gap-1">
                                  <span className="material-symbols-outlined text-xs">verified</span>
                                  ELITE CADRE
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-on-tertiary-fixed dark:bg-surface-container-lowest w-full border-t-2 border-on-surface py-8 px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter md:ml-64 absolute bottom-0 left-0 z-20">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary leading-none mb-4 uppercase tracking-tighter">IJP</h2>
          <p className="font-mono-style text-mono-style uppercase text-tertiary-fixed-dim">© 1984 ISHAN JANTA PARTY. ALL TRUTHS RESERVED.</p>
        </div>
        <div className="flex flex-col md:items-end justify-center gap-2">
          <Link className="text-tertiary-fixed-dim hover:text-primary font-mono-style text-mono-style uppercase hover:bg-primary hover:text-on-primary px-2 transition-all self-start md:self-end" to="/truth-directorate">LEGAL LIES</Link>
          <Link className="text-tertiary-fixed-dim hover:text-primary font-mono-style text-mono-style uppercase hover:bg-primary hover:text-on-primary px-2 transition-all self-start md:self-end" to="/truth-directorate">PRIVACY ILLUSION</Link>
          <Link className="text-primary underline font-mono-style text-mono-style uppercase hover:bg-primary hover:text-on-primary px-2 transition-all self-start md:self-end" to="/student-hub">STUDENT PORTAL</Link>
        </div>
      </footer>
    </div>
  );
}
