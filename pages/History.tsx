
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatSession, Message } from '../types';

const History: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('mba_bot_sessions');
    if (saved) {
      setSessions(JSON.parse(saved).sort((a: any, b: any) => b.timestamp - a.timestamp));
    }
  }, []);

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('mba_bot_sessions', JSON.stringify(updated));
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to get a clean, concise title from the first user message
  const getConciseTitle = (session: ChatSession) => {
    const firstUserMsg = session.messages.find(m => m.role === 'user');
    if (!firstUserMsg) return 'محادثة فارغة';

    const textPart = firstUserMsg.parts.find((p): p is { text: string } => 'text' in p);
    if (!textPart) return 'محادثة وسائط';

    // Remove common filler words or code block markers if any for a cleaner title
    let title = textPart.text
      .replace(/```[\s\S]*?```/g, '[Code]') // Replace code blocks
      .replace(/^(اكتب لي كود|ممكن كود|اريد حل لـ|كيف اصنع|شرح)/i, '') // Remove common prefixes
      .trim();

    if (title.length > 45) {
      return title.substring(0, 45).trim() + '...';
    }
    return title || 'محادثة برمجية';
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn scrollbar-hide h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">سجل <span className="text-indigo-500">المحادثات</span></h1>
          <p className="text-slate-500 mt-2 font-medium">استرجع حلولك البرمجية السابقة في أي وقت</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-500/20 shadow-lg">
            {sessions.length} جلسة محفوظة
          </span>
          {sessions.length > 0 && (
            <button 
              onClick={() => {
                if(confirm('هل أنت متأكد من حذف جميع المحادثات؟')) {
                  localStorage.removeItem('mba_bot_sessions');
                  setSessions([]);
                }
              }}
              className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
            >
              مسح الكل
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-slate-800/30 border-2 border-dashed border-slate-700 p-20 rounded-[3rem] text-center backdrop-blur-sm animate-pulse">
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600 text-3xl mx-auto mb-6">
            <i className="fas fa-ghost"></i>
          </div>
          <p className="text-slate-400 text-xl font-bold mb-6">لا توجد محادثات محفوظة حالياً</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            ابدأ محادثة جديدة
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => navigate(`/?session=${session.id}`)}
              className="group bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] hover:bg-slate-800/60 hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between shadow-lg hover:shadow-2xl hover:-translate-y-1 backdrop-blur-sm"
            >
              <div className="flex items-center gap-5 overflow-hidden">
                <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                  <i className="fas fa-code text-xl"></i>
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-white font-black text-lg line-clamp-1 group-hover:text-indigo-300 transition-colors">
                    {getConciseTitle(session)}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <i className="far fa-calendar-alt text-indigo-500/50"></i>
                      {formatDate(session.timestamp)}
                    </span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-comment-dots text-indigo-500/50"></i>
                      {session.messages.length} رسالة
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  title="حذف المحادثة"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
                <div className="text-slate-600 group-hover:text-indigo-400 transition-colors mr-2">
                  <i className="fas fa-chevron-left"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
