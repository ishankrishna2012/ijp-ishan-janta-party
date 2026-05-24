import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const { user, signOutOperative, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const handleUploadId = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const filePath = `${user.id}/id-card.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ id_card_url: filePath })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      // refresh context to update id_card_url locally immediately
      await refreshUser();
      alert("ID Card uploaded successfully! Awaiting Directorate verification.");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen overflow-x-hidden selection:bg-primary selection:text-on-primary relative flex">
      {/* Background Texture */}
      <div className="absolute inset-0 scanline-bg pointer-events-none z-0 opacity-40"></div>
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-surface border-r-4 border-on-surface flex flex-col relative z-10 shrink-0">
        <div className="p-6 border-b-4 border-on-surface bg-on-surface text-surface text-center">
          <span className="material-symbols-outlined text-4xl mb-2">shield</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile uppercase tracking-tighter leading-none">IJP<br/>DIRECTORATE</h2>
          <div className="font-mono-style text-[10px] text-primary mt-2 uppercase">CLASS-A ACCESS</div>
        </div>
        
        <div className="p-4 flex-grow flex flex-col gap-2">
          {/* Identity Box */}
          <div className="mb-6 bg-surface p-3 border-2 border-on-surface text-xs font-mono-style uppercase relative overflow-hidden">
            {/* Stamp if verified */}
            {user?.verified && (
              <div className="absolute -top-2 -right-2 transform rotate-[15deg] opacity-80 pointer-events-none">
                <div className="border-2 border-secondary text-secondary p-1 bg-surface-container-lowest">
                  <span className="font-bold text-[8px] uppercase block">VERIFIED</span>
                </div>
              </div>
            )}
            <div className="text-tertiary">CODENAME:</div>
            <div className="font-bold text-on-surface text-sm truncate">{user?.codename}</div>
            <div className="text-tertiary mt-2">SECTION:</div>
            <div className="font-bold text-on-surface text-[10px] truncate">Division {user?.section || 'A'}</div>
            <div className="text-tertiary mt-2">ID:</div>
            <div className="font-bold text-primary text-[10px]">{user?.unique_id}</div>
          </div>

          <Link to="/student-hub" className="nav-btn group text-left">
            <span className="material-symbols-outlined group-hover:text-primary transition-colors">school</span>
            GRADE 9 HUB
          </Link>
          <button className="nav-btn group text-left active-nav-btn">
            <span className="material-symbols-outlined group-hover:text-primary transition-colors">badge</span>
            DOSSIER (PROFILE)
          </button>
          <Link to="/truth-directorate" className="nav-btn group text-left">
            <span className="material-symbols-outlined group-hover:text-primary transition-colors">campaign</span>
            REPORTING TOOLS
          </Link>
          
          <div className="mt-auto">
            <button onClick={signOutOperative} className="w-full bg-error text-on-error border-2 border-on-surface py-3 font-label-bold text-label-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
              SECURE LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 relative z-10 overflow-y-auto max-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 border-b-4 border-on-surface pb-6 text-left">
            <div className="inline-block bg-on-surface text-surface-container-lowest px-2 py-1 font-mono-style text-mono-style uppercase mb-4 shadow-[2px_2px_0px_0px_#ff9933]">
              <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
              CLASSIFIED: PERSONAL RECORD
            </div>
            <h1 className="font-display-lg text-headline-xl md:text-display-lg text-on-surface uppercase tracking-tighter leading-none">OPERATIVE DOSSIER</h1>
          </header>

          {/* Verification Warning Box */}
          {!user?.verified && (
            <div className="border-4 border-error bg-error-container p-6 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-4xl text-error">warning</span>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-error-container uppercase leading-none mb-2">VERIFICATION PENDING</h3>
                  <p className="font-mono-style text-sm text-on-error-container opacity-90 mb-4">
                    Your D-Number and ID Card upload are currently under review by the Directorate. Until verified, your access may be monitored, restricted, or completely revoked at any time. Compliance is mandatory.
                  </p>
                  
                  {!user?.id_card_url && (
                    <div className="mt-4">
                      <label className="bg-surface text-on-surface px-4 py-2 border-2 border-on-error-container cursor-pointer hover:bg-surface-variant transition-colors font-label-bold inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                        UPLOAD MISSING ID CARD
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUploadId} disabled={uploading} />
                      </label>
                      {uploading && <span className="ml-4 font-mono-style text-xs font-bold text-on-error-container animate-pulse">TRANSMITTING SECURE DATA...</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grid Layout for Profile Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Basic Info */}
            <div className="border-4 border-on-surface bg-surface-container-lowest p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="font-headline-md text-headline-md uppercase border-b-2 border-on-surface pb-2 mb-4">IDENTITY MATRIX</h2>
              
              <div className="space-y-4 font-mono-style text-sm">
                <div>
                  <div className="text-tertiary">CODENAME</div>
                  <div className="text-xl font-bold uppercase">{user?.codename}</div>
                </div>
                <div>
                  <div className="text-tertiary">EMAIL UPLINK</div>
                  <div className="font-bold">{user?.email}</div>
                </div>
                <div>
                  <div className="text-tertiary">D-NUMBER</div>
                  <div className="text-xl font-bold font-mono tracking-widest">{user?.d_no}</div>
                </div>
                <div>
                  <div className="text-tertiary">UNIQUE IDENTIFIER</div>
                  <div className="text-primary font-bold text-xl">{user?.unique_id}</div>
                </div>
                <div>
                  <div className="text-tertiary">SECTION ASSIGNMENT</div>
                  <div className="font-bold uppercase">Division {user?.section}</div>
                </div>
              </div>
            </div>

            {/* Right Column: Clearance & Stats */}
            <div className="space-y-8">
              <div className="border-4 border-on-surface bg-surface-container p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="font-headline-md text-headline-md uppercase border-b-2 border-on-surface pb-2 mb-4">CLEARANCE STATUS</h2>
                <div className="flex items-center gap-4">
                  {user?.verified ? (
                    <div className="flex-1 bg-secondary text-on-secondary p-4 text-center border-2 border-on-surface">
                      <span className="material-symbols-outlined text-4xl mb-2">verified_user</span>
                      <div className="font-bold font-mono-style">VERIFIED ACTIVE</div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-surface-variant text-on-surface-variant p-4 text-center border-2 border-on-surface opacity-70">
                      <span className="material-symbols-outlined text-4xl mb-2">hourglass_empty</span>
                      <div className="font-bold font-mono-style">PENDING REVIEW</div>
                    </div>
                  )}
                  
                  <div className="flex-1 bg-primary text-on-primary p-4 text-center border-2 border-on-surface">
                    <span className="material-symbols-outlined text-4xl mb-2">military_tech</span>
                    <div className="font-bold font-mono-style">LEVEL 9 ACCESS</div>
                  </div>
                </div>
              </div>

              <div className="border-4 border-on-surface bg-surface-container p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="font-headline-md text-headline-md uppercase border-b-2 border-on-surface pb-2 mb-4">SYSTEM LOG</h2>
                <div className="font-mono-style text-xs text-on-surface-variant space-y-2">
                  <div className="flex justify-between border-b border-surface-variant pb-1">
                    <span>ACCOUNT CREATED</span>
                    <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-variant pb-1">
                    <span>LAST LOGIN</span>
                    <span>{new Date(user?.last_sign_in_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-variant pb-1">
                    <span>ID CARD UPLOAD</span>
                    <span>{user?.id_card_url ? 'SUCCESS' : 'MISSING'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
