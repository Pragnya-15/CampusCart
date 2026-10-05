import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Conversation, Message, Profile } from '@/types';
import { timeAgo, formatDateTime } from '@/utils/helpers';

export function MessagesPage() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!profile) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*, listing:listings(*), participant1:profiles!conversations_participant1_id_fkey(*), participant2:profiles!conversations_participant2_id_fkey(*)')
        .or(`participant1_id.eq.${profile.id},participant2_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });
      setConversations((data as unknown as Conversation[]) || []);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const convId = searchParams.get('c');
    if (convId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === convId);
      if (conv) setActiveConv(conv);
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (!activeConv || !profile) return;
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', activeConv!.id)
        .order('created_at', { ascending: true });
      setMessages((data as unknown as Message[]) || []);

      // Mark messages from the other person as read
      const otherId = activeConv!.participant1_id === profile!.id ? activeConv!.participant2_id : activeConv!.participant1_id;
      await supabase.from('messages').update({ read_status: true }).eq('conversation_id', activeConv!.id).eq('receiver_id', profile!.id).eq('read_status', false);
    }
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeConv, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || !profile) return;
    setSending(true);
    const otherId = activeConv.participant1_id === profile.id ? activeConv.participant2_id : activeConv.participant1_id;
    try {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: activeConv.id,
        sender_id: profile.id,
        receiver_id: otherId,
        body: newMessage.trim(),
      }).select('*, sender:profiles!messages_sender_id_fkey(*)').single();

      if (!error && data) {
        setMessages((prev) => [...prev, data as unknown as Message]);
        setNewMessage('');
        // Notify the other user
        await supabase.from('notifications').insert({
          user_id: otherId,
          type: 'message',
          title: `New message from ${profile.full_name}`,
          body: newMessage.trim().slice(0, 80),
          link: `/messages?c=${activeConv.id}`,
        });
      }
    } finally {
      setSending(false);
    }
  }

  function getOtherUser(conv: Conversation): Profile | null {
    if (!profile) return null;
    return (conv.participant1_id === profile.id ? conv.participant2 : conv.participant1) ?? null;
  }

  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery) return true;
    const other = getOtherUser(c);
    return other?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.listing?.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return <div className="container-max px-4 py-8"><div className="card h-96 animate-pulse" /></div>;
  }

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-3xl text-navy-900 mb-6">Messages</h1>

      <div className="card overflow-hidden h-[calc(100vh-220px)] min-h-[500px] flex">
        {/* Conversations List */}
        <div className={`w-full sm:w-80 border-r border-slate-200 flex flex-col ${activeConv ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="input pl-9 text-sm py-2"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                <MessageSquare size={28} className="mx-auto mb-2 text-slate-300" />
                No conversations yet.
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const other = getOtherUser(conv);
                const isActive = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConv(conv); setSearchParams({ c: conv.id }); }}
                    className={`w-full p-3 flex items-center gap-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${isActive ? 'bg-navy-50' : ''}`}
                  >
                    {other?.profile_image ? (
                      <img src={other.profile_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-400 to-brand-500 flex items-center justify-center text-white text-sm font-semibold">
                        {other?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{other?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400 truncate">{conv.listing?.title || 'No listing'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden sm:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Select a conversation to start chatting.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                <button onClick={() => { setActiveConv(null); setSearchParams({}); }} className="sm:hidden p-1 rounded-lg hover:bg-slate-100">
                  <ArrowLeft size={20} />
                </button>
                {(() => {
                  const other = getOtherUser(activeConv);
                  return (
                    <>
                      {other?.profile_image ? (
                        <img src={other.profile_image} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-400 to-brand-500 flex items-center justify-center text-white text-sm font-semibold">
                          {other?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm text-slate-800">{other?.full_name || 'Unknown'}</p>
                        {activeConv.listing && (
                          <p className="text-xs text-slate-400 truncate">Re: {activeConv.listing.title}</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-slate-400 py-8">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? 'bg-navy-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-navy-200' : 'text-slate-400'}`}>
                            {formatDateTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary px-3">
                  {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
