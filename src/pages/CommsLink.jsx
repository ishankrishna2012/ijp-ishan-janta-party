import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { dbService } from '../services/db';
import { getChatbotResponse } from '../utils/openai';

export default function CommsLink() {
  const { user, signOutOperative } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('chatbot'); // 'chatbot' or 'admin'
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedOperativeId, setSelectedOperativeId] = useState('');
  const [allDbMessages, setAllDbMessages] = useState([]);

  // Load all messages for active list & threads
  const loadAllMessages = async () => {
    if (!user) return;
    const data = await dbService.fetchChatMessages();
    if (data) {
      setAllDbMessages(data);
    }
  };

  // Auto-set admin mode
  useEffect(() => {
    if (user?.role === 'admin') {
      setMode('admin');
      const loadUsers = async () => {
        const allUsers = await dbService.fetchUsers();
        setAdminUsers(allUsers.filter(u => u.role !== 'admin'));
      };
      loadUsers();
    }
  }, [user]);

  // Load and subscribe to real-time chat messages
  useEffect(() => {
    if (!user) return;

    if (mode === 'admin') {
      loadAllMessages();

      const subscription = supabase.channel(`public:chat_messages:${user.id}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'chat_messages'
        }, () => {
            loadAllMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      // Chatbot mode initial message
      setMessages([{ id: 'init', text: 'Central Intelligence Online. State your query, Operative.', isBot: true, sender: 'chatbot' }]);
    }
  }, [user, mode]);

  // Filter messages for selected channel
  useEffect(() => {
    if (mode === 'admin') {
      const filtered = allDbMessages.filter(d => {
        if (user?.role === 'admin') {
          return (d.sender_id === selectedOperativeId) || 
                 (d.receiver_id === selectedOperativeId) ||
                 (d.sender_id === selectedOperativeId && d.receiver_type === 'admin');
        } else {
          return d.sender_id === user.id || d.receiver_id === user.id;
        }
      });
      
      setMessages(filtered.map(d => ({
        id: d.id,
        text: d.content,
        isBot: d.is_bot_response,
        sender: d.sender_id === user.id ? 'user' : 'other',
        senderCodename: d.profiles?.codename || 'OPERATIVE'
      })));
    }
  }, [allDbMessages, selectedOperativeId, mode, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');

    if (mode === 'chatbot') {
      const newMessages = [...messages, { id: Date.now().toString(), text: userText, isBot: false, sender: 'user' }];
      setMessages(newMessages);
      setIsTyping(true);

      const history = newMessages.map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text
      }));

      const botResponse = await getChatbotResponse(userText, history);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: botResponse, isBot: true, sender: 'chatbot' }]);
      setIsTyping(false);
    } else {
      // Admin Mode: Save to db
      const receiverType = user.role === 'admin' ? 'user' : 'admin';
      const receiverId = user.role === 'admin' ? selectedOperativeId : null;

      await dbService.insertChatMessage({
        sender_id: user.id,
        receiver_id: receiverId,
        receiver_type: receiverType,
        content: userText,
      });

      await loadAllMessages();
    }
  };

  // Group and sort users for admin sidebar
  const getAdminUserSections = () => {
    const activeUserMap = new Map();
    
    allDbMessages.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (otherId && otherId !== user.id) {
        activeUserMap.set(otherId, msg);
      }
    });

    const activeOps = [];
    const inactiveOps = [];

    adminUsers.forEach(u => {
      if (activeUserMap.has(u.id)) {
        activeOps.push({
          ...u,
          latestMessage: activeUserMap.get(u.id)
        });
      } else {
        inactiveOps.push(u);
      }
    });

    // Sort activeOps by latest message created_at descending
    activeOps.sort((a, b) => {
      const dateA = new Date(a.latestMessage.created_at);
      const dateB = new Date(b.latestMessage.created_at);
      return dateB - dateA;
    });

    return { activeOps, inactiveOps };
  };

  const { activeOps, inactiveOps } = getAdminUserSections();

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
            <Link className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase border-2 border-transparent hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/student-hub">
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
            <div className="bg-secondary-container text-on-secondary-container border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase translate-x-1 transition-transform duration-75">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>satellite_alt</span>
              SECURE COMMS LINK
            </div>
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
      <main className="flex-grow md:ml-64 pt-8 md:pt-0 min-h-screen relative flex flex-col">
        <div className="px-margin-mobile md:px-margin-desktop py-8 max-w-4xl mx-auto flex flex-col h-full w-full">
          
          <header className="mb-6 border-b-4 border-on-surface pb-6 shrink-0">
            <h1 className="font-display-lg text-headline-xl md:text-display-lg text-on-surface uppercase tracking-tighter leading-none mb-4">SECURE COMMS LINK</h1>
            
            {/* Mode Switcher / Admin Operative Selector */}
            {user?.role === 'admin' ? (
              <div className="text-xs font-mono-style uppercase bg-surface-container-highest border-2 border-on-surface p-2.5 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-primary font-bold">
                🔒 ADMINISTRATOR OVERRIDE UPLINK ACTIVE
              </div>
            ) : (
              <div className="flex gap-4 p-2 bg-surface-container-highest border-2 border-on-surface inline-flex shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <button 
                  onClick={() => setMode('chatbot')}
                  className={`px-4 py-2 font-label-bold uppercase text-sm border-2 ${mode === 'chatbot' ? 'bg-primary text-on-primary border-on-surface shadow-none translate-y-[2px] translate-x-[2px]' : 'bg-surface hover:bg-surface-variant border-transparent'} transition-all flex items-center gap-2`}
                >
                  <span className="material-symbols-outlined text-[18px]">memory</span>
                  CENTRAL AI
                </button>
                <button 
                  onClick={() => setMode('admin')}
                  className={`px-4 py-2 font-label-bold uppercase text-sm border-2 ${mode === 'admin' ? 'bg-secondary text-on-secondary border-on-surface shadow-none translate-y-[2px] translate-x-[2px]' : 'bg-surface hover:bg-surface-variant border-transparent'} transition-all flex items-center gap-2`}
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  HUMAN ADMIN
                </button>
              </div>
            )}
          </header>

          {/* Chat Window */}
          <div className="flex-grow flex flex-col border-4 border-on-surface bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden min-h-[500px]">
            {user?.role === 'admin' ? (
              <div className="flex flex-grow h-full min-h-[500px]">
                {/* Admin Sidebar */}
                <div className={`w-full md:w-80 bg-surface-container-high border-r-0 md:border-r-4 border-on-surface flex flex-col shrink-0 ${selectedOperativeId ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-4 border-b-2 border-on-surface bg-surface font-label-bold text-sm uppercase tracking-wider text-on-surface flex justify-between items-center">
                    <span>Operative Channels</span>
                    <span className="bg-primary text-on-primary px-2 py-0.5 text-xs font-mono-style">{adminUsers.length}</span>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto p-2 space-y-4">
                    {/* Active Transmissions Section */}
                    <div>
                      <div className="text-[10px] font-mono-style uppercase text-tertiary px-2 mb-2 font-bold tracking-widest">Active Transmissions</div>
                      {activeOps.length === 0 ? (
                        <div className="text-xs font-mono-style uppercase text-on-surface-variant italic p-4 text-center border-2 border-dashed border-outline-variant bg-surface">
                          No active transmissions
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {activeOps.map(op => {
                            const isSelected = op.id === selectedOperativeId;
                            const isUnread = op.latestMessage.sender_id === op.id && op.latestMessage.receiver_type === 'admin';
                            return (
                              <button
                                key={op.id}
                                onClick={() => setSelectedOperativeId(op.id)}
                                className={`w-full text-left p-3 border-2 border-on-surface flex flex-col transition-all ${
                                  isSelected 
                                    ? 'bg-secondary text-on-secondary shadow-none translate-x-[2px] translate-y-[2px]' 
                                    : 'bg-surface hover:bg-surface-variant shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-label-bold text-xs uppercase truncate max-w-[120px]">{op.codename}</span>
                                  <span className="text-[9px] font-mono-style uppercase opacity-75">DIV {op.section || 'A'}</span>
                                </div>
                                <div className="flex justify-between items-center w-full mt-1">
                                  <p className="text-[10px] font-mono-style truncate max-w-[150px] opacity-90">{op.latestMessage.content}</p>
                                  {isUnread && (
                                    <span className="w-2.5 h-2.5 bg-error rounded-full animate-pulse border border-on-surface shrink-0"></span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Secure Contacts Section */}
                    <div>
                      <div className="text-[10px] font-mono-style uppercase text-tertiary px-2 mb-2 font-bold tracking-widest">Secure Contacts</div>
                      {inactiveOps.length === 0 ? (
                        <div className="text-xs font-mono-style uppercase text-on-surface-variant italic p-4 text-center border-2 border-dashed border-outline-variant bg-surface">
                          No additional operatives
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                          {inactiveOps.map(op => {
                            const isSelected = op.id === selectedOperativeId;
                            return (
                              <button
                                key={op.id}
                                onClick={() => setSelectedOperativeId(op.id)}
                                className={`w-full text-left p-2.5 border-2 border-on-surface flex justify-between items-center transition-all ${
                                  isSelected 
                                    ? 'bg-secondary text-on-secondary' 
                                    : 'bg-surface hover:bg-surface-variant shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                              >
                                <span className="font-label-bold text-[11px] uppercase truncate">{op.codename}</span>
                                <span className="text-[9px] font-mono-style uppercase opacity-75">DIV {op.section || 'A'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Chat Area */}
                <div className={`flex-grow flex flex-col ${!selectedOperativeId ? 'hidden md:flex' : 'flex'}`}>
                  {selectedOperativeId ? (
                    <>
                      {/* Active Target Header */}
                      <div className="p-4 border-b-2 border-on-surface bg-surface-container font-mono-style text-xs uppercase tracking-wider text-on-surface flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setSelectedOperativeId('')}
                            className="md:hidden flex items-center justify-center p-1 bg-surface border-2 border-on-surface hover:bg-surface-variant"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                          </button>
                          <div>
                            <span className="font-bold text-primary">TARGET: </span>
                            <span>{adminUsers.find(u => u.id === selectedOperativeId)?.codename || 'OPERATIVE'}</span>
                            <span className="ml-2 px-1.5 py-0.5 bg-surface-variant text-[9px] font-bold">DIV {adminUsers.find(u => u.id === selectedOperativeId)?.section || 'A'}</span>
                          </div>
                        </div>
                        <div className="text-[9px] text-tertiary">SECURE TRANSMISSION TUNNEL</div>
                      </div>

                      {/* Messages List */}
                      <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[350px]">
                        {messages.length === 0 ? (
                          <div className="text-center py-12 text-on-surface-variant font-mono-style text-xs uppercase italic">
                            Secure channel open. Send initial transmission below.
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isMine = msg.sender === 'user';
                            return (
                              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                <div className="font-mono-style text-[10px] text-tertiary mb-1 uppercase">
                                  {isMine ? user.codename : msg.senderCodename || 'OPERATIVE'}
                                </div>
                                <div className={`p-3 max-w-[80%] border-2 border-on-surface font-mono-style text-sm ${
                                  isMine 
                                    ? 'bg-primary text-on-primary rounded-l-lg rounded-br-lg' 
                                    : 'bg-surface-container-highest text-on-surface rounded-r-lg rounded-bl-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input form */}
                      <form onSubmit={handleSendMessage} className="p-4 bg-surface-container border-t-4 border-on-surface flex gap-4 shrink-0 mt-auto">
                        <input 
                          type="text"
                          value={inputValue}
                          onChange={e => setInputValue(e.target.value)}
                          placeholder="Send secure transmission..."
                          className="flex-grow bg-surface border-2 border-on-surface p-3 font-mono-style text-on-surface outline-none focus:border-secondary"
                        />
                        <button 
                          type="submit"
                          disabled={!inputValue.trim()}
                          className="bg-primary text-on-primary border-2 border-on-surface px-6 font-label-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          TRANSMIT
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest">
                      <div className="w-16 h-16 bg-surface-container-high border-4 border-on-surface flex items-center justify-center rounded-DEFAULT shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 text-primary">
                        <span className="material-symbols-outlined text-4xl animate-pulse">satellite_alt</span>
                      </div>
                      <h3 className="font-headline-lg text-xl uppercase mb-2">No Active Target Selected</h3>
                      <p className="font-mono-style text-xs text-on-surface-variant max-w-md uppercase leading-relaxed animate-pulse">
                        Select a target operative from the left transmission panel to establish a secure comms channel.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[400px]">
                  {messages.map((msg) => {
                    const isMine = msg.sender === 'user';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className="font-mono-style text-[10px] text-tertiary mb-1 uppercase">
                          {isMine ? user.codename : (mode === 'chatbot' ? 'CENTRAL INTELLIGENCE' : 'DIRECTORATE ADMIN')}
                        </div>
                        <div className={`p-3 max-w-[80%] border-2 border-on-surface font-mono-style text-sm ${
                          isMine 
                            ? 'bg-primary text-on-primary rounded-l-lg rounded-br-lg' 
                            : 'bg-surface-container-highest text-on-surface rounded-r-lg rounded-bl-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex flex-col items-start">
                      <div className="font-mono-style text-[10px] text-tertiary mb-1 uppercase">CENTRAL INTELLIGENCE</div>
                      <div className="p-3 border-2 border-on-surface bg-surface-container-highest text-on-surface rounded-r-lg rounded-bl-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex gap-1">
                        <span className="w-2 h-2 bg-on-surface animate-ping rounded-full"></span>
                        <span className="w-2 h-2 bg-on-surface animate-ping rounded-full delay-75"></span>
                        <span className="w-2 h-2 bg-on-surface animate-ping rounded-full delay-150"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-surface-container border-t-4 border-on-surface flex gap-4 shrink-0">
                  <input 
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={mode === 'chatbot' ? "Query Central Intelligence..." : "Send secure transmission to Admin..."}
                    className="flex-grow bg-surface border-2 border-on-surface p-3 font-mono-style text-on-surface outline-none focus:border-secondary"
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="bg-primary text-on-primary border-2 border-on-surface px-6 font-label-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    TRANSMIT
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
