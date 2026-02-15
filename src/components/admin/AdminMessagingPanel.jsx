import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MessageSquare, Hash, AlertTriangle, Send, Search,
  X, Plus, ChevronLeft, Users, Circle,
  Paperclip, Mic, Lock, FileIcon, Play, Square,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ROLE_LABELS, ROLE_COLORS, normalizeRole, MOCK_ADMIN_ACCOUNTS,
} from '../../utils/rbac.js';
import {
  getChannels, getDMs, getMessages,
  sendMessage, sendSecuredMessage, markRead,
} from '../../services/adminMessaging.service.js';

/* ════════════════════════════════════════════════════════════
   ADMIN MESSAGING PANEL — Slack-style inter-admin chat

   Slide-out drawer with:
   • Left sidebar  — Channels (panel / incident) + Direct Messages
   • Right pane    — Active conversation with message input
   • Mobile        — Shows list OR conversation (not both)
   • New message   — Pick any admin from MOCK_ADMIN_ACCOUNTS
════════════════════════════════════════════════════════════ */

/* ── Helpers ─────────────────────────────────────────────── */

function formatTimestamp(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }) + ` ${time}`;
}

function formatDateSeparator(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

/* ── Role Badge Component ──────────────────────────────── */

function RoleBadge({ role }) {
  const normalized = normalizeRole(role);
  const label = ROLE_LABELS[normalized] || role;
  const color = ROLE_COLORS[normalized] || 'bg-gray-500/10 text-gray-400';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold capitalize shrink-0 ${color}`}>
      {label}
    </span>
  );
}

/* ── Unread Badge ──────────────────────────────────────── */

function UnreadBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[9px] font-bold text-white shrink-0">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/* ── New Message Modal ────────────────────────────────── */

function NewMessageModal({ isOpen, onClose, onSelect, currentAdminId }) {
  const [search, setSearch] = useState('');

  const filteredAdmins = useMemo(() => {
    return MOCK_ADMIN_ACCOUNTS
      .filter(a => a.id !== currentAdminId)
      .filter(a => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q)
          || a.email.toLowerCase().includes(q)
          || (ROLE_LABELS[a.role] || '').toLowerCase().includes(q);
      });
  }, [search, currentAdminId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-gray-800 border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">New Message</h3>
          <button onClick={onClose} className="p-1 text-gray-400 rounded-lg hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute text-gray-500 left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admins..."
              className="w-full py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 bg-gray-900 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
              autoFocus
            />
          </div>
        </div>

        {/* Admin list */}
        <div className="px-2 pb-3 max-h-64 overflow-y-auto">
          {filteredAdmins.length === 0 && (
            <p className="px-3 py-4 text-xs text-center text-gray-500">No admins found</p>
          )}
          {filteredAdmins.map(admin => (
            <button
              key={admin.id}
              onClick={() => { onSelect(admin); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 shrink-0">
                <span className="text-xs font-bold uppercase text-brand-gold">{getInitials(admin.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">{admin.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{admin.email}</p>
              </div>
              <RoleBadge role={admin.role} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */

export default function AdminMessagingPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const currentAdminId = user?.id || 'adm_006';
  const currentAdminName = user?.name || 'Fatima Bello';
  const currentAdminRole = normalizeRole(user?.role || 'support_admin');
  const isSuperAdmin = currentAdminRole === 'super_admin';

  // ── State ────────────────────────────────────────────────
  const [channels, setChannels]       = useState([]);
  const [dms, setDms]                 = useState([]);
  const [messages, setMessages]       = useState([]);
  const [activeView, setActiveView]   = useState(null);   // { type: 'channel'|'dm', id: string, name: string, role?: string }
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // ── Super Admin: file & voice note ──────────────────────
  const [attachedFile, setAttachedFile]     = useState(null);
  const [voiceRecording, setVoiceRecording] = useState(null);
  const [isRecording, setIsRecording]       = useState(false);
  const [recordingTime, setRecordingTime]   = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Load channels & DMs on open ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const [chRes, dmRes] = await Promise.all([
        getChannels(),
        getDMs(currentAdminId),
      ]);
      if (chRes.success) setChannels(chRes.channels);
      if (dmRes.success) setDms(dmRes.dms);
    })();
  }, [isOpen, currentAdminId]);

  // ── Load messages when active view changes ──────────────
  useEffect(() => {
    if (!activeView) { setMessages([]); return; }
    setLoading(true);
    (async () => {
      const params = activeView.type === 'channel'
        ? { channelId: activeView.id }
        : { recipientId: activeView.id };
      const res = await getMessages(params);
      if (res.success) setMessages(res.messages);
      setLoading(false);

      // Mark as read
      if (activeView.type === 'channel') {
        await markRead({ channelId: activeView.id });
        setChannels(prev => prev.map(ch => ch.id === activeView.id ? { ...ch, unread: 0 } : ch));
      } else {
        await markRead({ recipientId: activeView.id });
        setDms(prev => prev.map(dm => dm.recipientId === activeView.id ? { ...dm, unread: 0 } : dm));
      }
    })();
  }, [activeView]);

  // ── Auto-scroll to bottom on new messages ───────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Close on Escape ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Lock body scroll when open ──────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Send message ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!messageInput.trim() && !attachedFile && !voiceRecording) return;
    if (!activeView) return;

    const fileData = attachedFile
      ? { name: attachedFile.name, url: attachedFile.preview || '#pending-upload', type: attachedFile.type, size: attachedFile.size }
      : null;
    const voiceData = voiceRecording
      ? { url: voiceRecording.url, duration: voiceRecording.duration }
      : null;

    const params = {
      content: messageInput.trim(),
      senderId: currentAdminId,
      senderName: currentAdminName,
      senderRole: currentAdminRole,
      file: fileData,
      voiceNote: voiceData,
    };

    if (activeView.type === 'channel') {
      params.channelId = activeView.id;
    } else {
      params.recipientId = activeView.id;
    }

    setMessageInput('');
    setAttachedFile(null);
    setVoiceRecording(null);

    const sendFn = isSuperAdmin && activeView.type === 'dm' && (fileData || voiceData)
      ? sendSecuredMessage : sendMessage;
    const res = await sendFn(params);
    if (res.success && res.message) {
      setMessages(prev => [...prev, res.message]);
    }

    inputRef.current?.focus();
  }, [messageInput, attachedFile, voiceRecording, activeView, currentAdminId, currentAdminName, currentAdminRole, isSuperAdmin]);

  // ── Select conversation ─────────────────────────────────
  const selectChannel = useCallback((channel) => {
    setActiveView({ type: 'channel', id: channel.id, name: channel.name, channelType: channel.type });
    setMobileShowChat(true);
  }, []);

  const selectDM = useCallback((dm) => {
    setActiveView({ type: 'dm', id: dm.recipientId, name: dm.recipientName, role: dm.recipientRole });
    setMobileShowChat(true);
  }, []);

  const startDMWithAdmin = useCallback((admin) => {
    // Check if DM already exists
    const existing = dms.find(d => d.recipientId === admin.id);
    if (!existing) {
      // Add to DMs list
      setDms(prev => [{
        recipientId: admin.id,
        recipientName: admin.name,
        recipientRole: admin.role,
        lastMessage: '',
        lastTimestamp: new Date().toISOString(),
        unread: 0,
      }, ...prev]);
    }
    setActiveView({ type: 'dm', id: admin.id, name: admin.name, role: admin.role });
    setMobileShowChat(true);
  }, [dms]);

  const handleBack = useCallback(() => {
    setMobileShowChat(false);
  }, []);

  // ── Super Admin: voice recording (MediaRecorder API) ───
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setVoiceRecording({ blob, url, duration: recordingTime });
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { /* Microphone permission denied or unavailable */ }
  }, [recordingTime]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  }, []);

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setVoiceRecording(null);
    setRecordingTime(0);
    clearInterval(timerRef.current);
  }, []);

  // ── Filter conversations by search ──────────────────────
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(ch => ch.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  const filteredDMs = useMemo(() => {
    if (!searchQuery.trim()) return dms;
    const q = searchQuery.toLowerCase();
    return dms.filter(dm =>
      dm.recipientName.toLowerCase().includes(q)
      || (ROLE_LABELS[dm.recipientRole] || '').toLowerCase().includes(q)
    );
  }, [dms, searchQuery]);

  // ── Group channels by type ──────────────────────────────
  const panelChannels = useMemo(() => filteredChannels.filter(ch => ch.type === 'panel'), [filteredChannels]);
  const incidentChannels = useMemo(() => filteredChannels.filter(ch => ch.type === 'incident'), [filteredChannels]);

  // ── Group messages by date ──────────────────────────────
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;
    for (const msg of messages) {
      const dateKey = new Date(msg.timestamp).toDateString();
      if (dateKey !== lastDate) {
        groups.push({ type: 'separator', date: msg.timestamp, key: `sep_${dateKey}` });
        lastDate = dateKey;
      }
      groups.push({ type: 'message', data: msg, key: msg.id });
    }
    return groups;
  }, [messages]);

  // ── Total unread count ──────────────────────────────────
  const totalUnread = useMemo(() => {
    const chUnread = channels.reduce((sum, ch) => sum + (ch.unread || 0), 0);
    const dmUnread = dms.reduce((sum, dm) => sum + (dm.unread || 0), 0);
    return chUnread + dmUnread;
  }, [channels, dms]);

  if (!isOpen) return null;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[160] w-full sm:w-[480px] md:w-[680px] lg:w-[800px] bg-gray-900 border-l border-white/5 shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Admin Messaging"
      >
        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-gold/10">
              <MessageSquare size={16} className="text-brand-gold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Admin Messaging</h2>
              <p className="text-[10px] text-gray-500">
                {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowNewMessage(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-brand-gold bg-brand-gold/10 rounded-lg hover:bg-brand-gold/20 transition-colors"
            >
              <Plus size={13} />
              New Message
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close messaging"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ═══ CONTENT AREA (sidebar + chat) ═══ */}
        <div className="flex flex-1 min-h-0">

          {/* ── LEFT SIDEBAR: Conversation List ── */}
          <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[260px] lg:w-[280px] border-r border-white/5 shrink-0`}>

            {/* Search */}
            <div className="px-3 py-2.5 border-b border-white/5">
              <div className="relative">
                <Search size={13} className="absolute text-gray-500 left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-600 bg-white/5 border border-white/5 rounded-lg outline-none focus:ring-1 focus:ring-brand-gold/30 focus:border-brand-gold/30"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto">

              {/* Super Admin: Secured Messages indicator */}
              {isSuperAdmin && (
                <div className="pt-3 pb-1 px-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <Lock size={13} className="text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Secured Messaging</p>
                      <p className="text-[9px] text-gray-500">Files & voice notes enabled</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel Channels */}
              {panelChannels.length > 0 && (
                <div className="pt-3 pb-1">
                  <p className="px-3 mb-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Channels</p>
                  {panelChannels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => selectChannel(ch)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors group
                        ${activeView?.id === ch.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                      <Hash size={14} className="text-gray-500 shrink-0" />
                      <span className={`text-sm flex-1 truncate ${activeView?.id === ch.id ? 'text-white font-semibold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                        {ch.name}
                      </span>
                      <UnreadBadge count={ch.unread} />
                    </button>
                  ))}
                </div>
              )}

              {/* Incident Channels */}
              {incidentChannels.length > 0 && (
                <div className="pt-3 pb-1">
                  <p className="px-3 mb-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Incidents</p>
                  {incidentChannels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => selectChannel(ch)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors group
                        ${activeView?.id === ch.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                      <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                      <span className={`text-xs flex-1 truncate ${activeView?.id === ch.id ? 'text-white font-semibold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                        {ch.name}
                      </span>
                      <UnreadBadge count={ch.unread} />
                    </button>
                  ))}
                </div>
              )}

              {/* Direct Messages */}
              <div className="pt-3 pb-2">
                <p className="px-3 mb-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Direct Messages</p>
                {filteredDMs.length === 0 && (
                  <p className="px-3 py-3 text-xs text-center text-gray-600">No conversations yet</p>
                )}
                {filteredDMs.map(dm => (
                  <button
                    key={dm.recipientId}
                    onClick={() => selectDM(dm)}
                    className={`flex items-start gap-2.5 w-full px-3 py-2.5 text-left transition-colors group
                      ${activeView?.id === dm.recipientId ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    {/* Avatar */}
                    <div className="flex items-center justify-center w-8 h-8 mt-0.5 rounded-full bg-brand-gold/10 shrink-0">
                      <span className="text-[10px] font-bold uppercase text-brand-gold">{getInitials(dm.recipientName)}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-xs font-semibold truncate ${activeView?.id === dm.recipientId ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {dm.recipientName}
                        </span>
                        <RoleBadge role={dm.recipientRole} />
                      </div>
                      <p className="text-[11px] text-gray-500 truncate leading-snug">{dm.lastMessage}</p>
                    </div>

                    {/* Unread + time */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] text-gray-600">{formatTimestamp(dm.lastTimestamp)}</span>
                      <UnreadBadge count={dm.unread} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANE: Active Conversation ── */}
          <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>

            {activeView ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 shrink-0">
                  {/* Mobile back button */}
                  <button
                    onClick={handleBack}
                    className="flex items-center justify-center w-8 h-8 -ml-1 text-gray-400 rounded-lg md:hidden hover:bg-white/5 transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Channel / DM info */}
                  {activeView.type === 'channel' ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {activeView.channelType === 'incident' ? (
                        <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      ) : (
                        <Hash size={16} className="text-gray-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{activeView.name}</h3>
                        <p className="text-[10px] text-gray-500">
                          {channels.find(ch => ch.id === activeView.id)?.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 shrink-0">
                        <span className="text-xs font-bold uppercase text-brand-gold">{getInitials(activeView.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white truncate">{activeView.name}</h3>
                          {activeView.role && <RoleBadge role={activeView.role} />}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Circle size={6} className="text-green-500 fill-green-500" />
                          <span className="text-[10px] text-gray-500">Online</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Members count for channels */}
                  {activeView.type === 'channel' && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 shrink-0">
                      <Users size={12} className="text-gray-500" />
                      <span className="text-[10px] text-gray-400">
                        {channels.find(ch => ch.id === activeView.id)?.members?.length || 0}
                      </span>
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 rounded-full border-brand-gold/30 border-t-brand-gold animate-spin" />
                        <span className="text-xs text-gray-500">Loading messages...</span>
                      </div>
                    </div>
                  ) : groupedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <MessageSquare size={32} className="text-gray-700" />
                      <p className="text-sm text-gray-500">No messages yet</p>
                      <p className="text-[10px] text-gray-600">Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    groupedMessages.map(item => {
                      if (item.type === 'separator') {
                        return (
                          <div key={item.key} className="flex items-center gap-3 py-3">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] text-gray-500 font-medium shrink-0">
                              {formatDateSeparator(item.date)}
                            </span>
                            <div className="flex-1 h-px bg-white/5" />
                          </div>
                        );
                      }

                      const msg = item.data;
                      const isOwn = msg.senderId === currentAdminId;

                      return (
                        <div
                          key={item.key}
                          className={`flex gap-2.5 py-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar */}
                          {!isOwn && (
                            <div className="flex items-center justify-center w-7 h-7 mt-1 rounded-full bg-brand-gold/10 shrink-0">
                              <span className="text-[9px] font-bold uppercase text-brand-gold">
                                {getInitials(msg.senderName)}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={`max-w-[75%] min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}>
                            {/* Sender info (channel messages and other's DMs) */}
                            {!isOwn && (
                              <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[11px] font-semibold text-gray-300">{msg.senderName}</span>
                                <RoleBadge role={msg.senderRole} />
                              </div>
                            )}

                            <div
                              className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
                                ${isOwn
                                  ? 'bg-brand-gold/10 text-gray-100 rounded-tr-md'
                                  : 'bg-white/5 text-gray-300 rounded-tl-md'
                                }`}
                            >
                              {msg.content}
                              {msg.file && (
                                <a href={msg.file.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                  <FileIcon size={14} className="text-brand-gold shrink-0" />
                                  <span className="text-xs truncate">{msg.file.name}</span>
                                  <span className="text-[9px] text-gray-500 shrink-0">
                                    {msg.file.size ? `${(msg.file.size / 1024).toFixed(0)}KB` : ''}
                                  </span>
                                </a>
                              )}
                              {msg.voiceNote && (
                                <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-white/5">
                                  <Play size={14} className="text-brand-gold shrink-0" />
                                  <div className="flex-1 h-1 rounded-full bg-white/10">
                                    <div className="h-1 rounded-full bg-brand-gold w-0" />
                                  </div>
                                  <span className="text-[9px] text-gray-500">{msg.voiceNote.duration}s</span>
                                </div>
                              )}
                              {msg.secured && (
                                <div className="flex items-center gap-1 mt-1 text-[9px] text-amber-400">
                                  <Lock size={8} /> Secured
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <p className={`text-[10px] text-gray-500 mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="px-4 py-3 border-t border-white/10 shrink-0">
                  {/* Super Admin: attachment previews */}
                  {attachedFile && (
                    <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/5">
                      <FileIcon size={12} className="text-brand-gold shrink-0" />
                      <span className="text-xs text-gray-300 truncate flex-1">{attachedFile.name}</span>
                      <button onClick={() => setAttachedFile(null)} className="text-gray-500 hover:text-white transition-colors" aria-label="Remove file">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {voiceRecording && !isRecording && (
                    <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/5">
                      <Mic size={12} className="text-brand-gold shrink-0" />
                      <span className="text-xs text-gray-300">Voice note ({voiceRecording.duration}s)</span>
                      <button onClick={() => setVoiceRecording(null)} className="ml-auto text-gray-500 hover:text-white transition-colors" aria-label="Remove voice note">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs text-red-300 font-semibold">Recording… {recordingTime}s</span>
                      <button onClick={cancelRecording} className="ml-auto text-xs text-gray-400 hover:text-white" aria-label="Cancel recording">Cancel</button>
                      <button onClick={stopRecording} className="text-xs text-red-400 hover:text-red-300 font-bold" aria-label="Stop recording">Stop</button>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    {/* Super Admin: file attach + voice buttons */}
                    {isSuperAdmin && !isRecording && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
                              setAttachedFile({ file: f, preview, name: f.name, size: f.size, type: f.type });
                            }
                            e.target.value = '';
                          }}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-brand-gold hover:bg-white/5 transition-colors"
                          aria-label="Attach file"
                        >
                          <Paperclip size={15} />
                        </button>
                        <button
                          onClick={startRecording}
                          className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-brand-gold hover:bg-white/5 transition-colors"
                          aria-label="Record voice note"
                        >
                          <Mic size={15} />
                        </button>
                      </div>
                    )}

                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={
                          activeView.type === 'channel'
                            ? `Message #${activeView.name}`
                            : `Message ${activeView.name}`
                        }
                        rows={1}
                        className="w-full py-2.5 px-3 text-sm text-gray-200 placeholder-gray-600 bg-white/5 border border-white/10 rounded-xl outline-none resize-none focus:ring-1 focus:ring-brand-gold/30 focus:border-brand-gold/30 max-h-24"
                        style={{ minHeight: '40px' }}
                      />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!messageInput.trim() && !attachedFile && !voiceRecording}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-gold text-gray-900 hover:bg-brand-gold-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                      aria-label="Send message"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[9px] text-gray-600">
                    {isSuperAdmin ? 'Enter to send • Shift+Enter for new line • Attach files or record voice' : 'Press Enter to send, Shift+Enter for new line'}
                  </p>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-3">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5">
                  <MessageSquare size={28} className="text-gray-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-400">Select a conversation</h3>
                <p className="text-[11px] text-gray-600 text-center max-w-[200px]">
                  Choose a channel or direct message from the sidebar to start chatting.
                </p>
                <button
                  onClick={() => setShowNewMessage(true)}
                  className="flex items-center gap-1.5 px-4 py-2 mt-2 text-xs font-semibold rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-colors"
                >
                  <Plus size={14} />
                  Start a conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onSelect={startDMWithAdmin}
        currentAdminId={currentAdminId}
      />

      {/* Slide-in animation style */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
