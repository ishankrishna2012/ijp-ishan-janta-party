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

  // Load Admin Messages if mode is admin
  useEffect(() => {
    if (!user) return;

    if (mode === 'admin') {
      const fetchAdminMessages = async () => {
        if (user.role === 'admin' && !selectedOperativeId) {
          setMessages([]);
          return;
        }

        const data = await dbService.fetchChatMessages();
        if (data) {
          const filtered = data.filter(d => {
            if (user.role === 'admin') {
              // Admin sees messages sent to/from the selected operative
              return (d.sender_id === selectedOperativeId) || 
                     (d.receiver_id === selectedOperativeId) ||
                     (d.sender_id === selectedOperativeId && d.receiver_type === 'admin');
            } else {
              // Student sees their own messages
              return d.sender_id === user.id || d.receiver_id === user.id;
            }
          });
          
          setMessages(filtered.map(d => ({
            id: d.id,
            text: d.content,
            isBot: d.is_bot_response,
            sender: d.sender_id === user.id ? 'user' : 'admin'
          })));
        }
      };

      fetchAdminMessages();

      const subscription = supabase.channel(`public:chat_messages:${user.id}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `receiver_id=eq.${user.id}`
        }, payload => {
            fetchAdminMessages();
        })
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `sender_id=eq.${user.id}`
        }, payload => {
            fetchAdminMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      // Chatbot mode initial message
      setMessages([{ id: 'init', text: 'Central Intelligence Online. State your query, Operative.', isBot: true, sender: 'chatbot' }]);
    }
  }, [user, mode, selectedOperativeId]);

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
      const tempId = Date.now().toString();
      setMessages(prev => [...prev, { id: tempId, text: userText, isBot: false, sender: 'user' }]);
      
      const receiverType = user.role === 'admin' ? 'user' : 'admin';
      const receiverId = user.role === 'admin' ? selectedOperativeId : null;

      await dbService.insertChatMessage({
        sender_id: user.id,
        receiver_id: receiverId,
        receiver_type: receiverType,
        content: userText,
      });
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
              <div className="flex gap-4 p-2 bg-surface-container-highest border-2 border-on-surface w-full max-w-sm">
                <select 
                  className="w-full bg-surface border-2 border-on-surface p-2 font-mono-style text-xs uppercase focus:outline-none focus:border-secondary"
                  value={selectedOperativeId}
                  onChange={e => setSelectedOperativeId(e.target.value)}
                >
                  <option value="">SELECT TARGET OPERATIVE...</option>
                  {adminUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.codename} (Div {u.section || 'A'})</option>
                  ))}
                </select>
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
          <div className="flex-grow flex flex-col border-4 border-on-surface bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden min-h-[400px]">
            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
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
                disabled={!inputValue.trim() || (user?.role === 'admin' && !selectedOperativeId)}
                className="bg-primary text-on-primary border-2 border-on-surface px-6 font-label-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                TRANSMIT
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
