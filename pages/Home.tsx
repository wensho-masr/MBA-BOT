
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleGenAI, Modality } from '@google/genai';
import { Message, ChatSession, UIState } from '../types';
import { generateGeminiResponse, generateTTS, decodeAudio, decodeAudioData, encodeAudio } from '../services/geminiService';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface HomeProps {
  setGlobalLoading: (loading: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setGlobalLoading }) => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showAutoSaveToast, setShowAutoSaveToast] = useState(false);
  
  const [uiState, setUiState] = useState<UIState>({
    isLoading: false,
    isThinking: true, 
    useSearch: true,
    useMaps: false,
    selectedModel: 'gemini-3-pro-preview',
    expertRole: 'general'
  });
  
  const [attachments, setAttachments] = useState<{ data: string; mimeType: string }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const messagesRef = useRef<Message[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    setGlobalLoading(isLoading);
  }, [isLoading, setGlobalLoading]);

  useEffect(() => {
    const sid = searchParams.get('session');
    if (sid) {
      const saved = localStorage.getItem('mba_bot_sessions');
      if (saved) {
        const sessions = JSON.parse(saved);
        const session = sessions.find((s: any) => s.id === sid);
        if (session) {
          setMessages(session.messages);
          setSessionId(sid);
        }
      }
    } else {
      setMessages([]);
      setSessionId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (messagesRef.current.length > 0) {
        saveChat(messagesRef.current, true);
      }
    }, 120000); 

    return () => clearInterval(interval);
  }, []);

  const saveChat = (finalMessages: Message[], isAuto = false) => {
    if (finalMessages.length === 0) return;

    const saved = localStorage.getItem('mba_bot_sessions');
    let sessions = saved ? JSON.parse(saved) : [];
    const sid = sessionIdRef.current || Date.now().toString();
    
    // Extract a concise title from the first message
    const firstUserMsg = finalMessages.find(m => m.role === 'user');
    const firstTextPart = firstUserMsg?.parts.find((p): p is { text: string } => 'text' in p);
    
    let title = "محادثة برمجية جديدة";
    if (firstTextPart?.text) {
      title = firstTextPart.text
        .replace(/```[\s\S]*?```/g, '') // Strip code blocks from title
        .replace(/^(اكتب لي كود|ممكن كود|اريد حل لـ|كيف اصنع|شرح)/i, '')
        .trim();
      title = title.substring(0, 45).trim() + (title.length > 45 ? '...' : '');
    }
    
    const sessionIndex = sessions.findIndex((s: any) => s.id === sid);
    if (sessionIndex > -1) {
      sessions[sessionIndex].messages = finalMessages;
      sessions[sessionIndex].timestamp = Date.now();
      // Keep title updated if it was previously default
      if (sessions[sessionIndex].title === "محادثة برمجية جديدة" || !sessions[sessionIndex].title) {
        sessions[sessionIndex].title = title;
      }
    } else {
      sessions.push({ id: sid, title: title || "محادثة برمجية", messages: finalMessages, timestamp: Date.now() });
    }
    
    localStorage.setItem('mba_bot_sessions', JSON.stringify(sessions));
    if (!sessionIdRef.current) setSessionId(sid);

    if (isAuto) {
      setShowAutoSaveToast(true);
      setTimeout(() => setShowAutoSaveToast(false), 3000);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    
    const userParts: any[] = attachments.map(a => ({ inlineData: a }));
    if (input.trim()) userParts.push({ text: input });
    
    const userMsg: Message = { role: 'user', parts: userParts };
    const currentMsgs = [...messages, userMsg];
    
    const currentInput = input;
    const currentAttachments = [...attachments];
    
    setMessages(currentMsgs);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const result = await generateGeminiResponse(messages.slice(-10), currentInput, uiState, currentAttachments);
      const parts: any[] = [{ text: result.text }];
      if (result.imagePart) parts.push(result.imagePart);
      
      const aiMsg: Message = { role: 'model', parts, groundingMetadata: result.groundingMetadata };
      const finalMsgs = [...currentMsgs, aiMsg];
      setMessages(finalMsgs);
      saveChat(finalMsgs);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "عذراً، واجهت مشكلة في معالجة هذا الطلب البرمجي." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    const base64 = await generateTTS(text);
    if (!base64) return;
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const ctx = audioContextRef.current;
    const audioData = decodeAudio(base64);
    const buffer = await decodeAudioData(audioData, ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  const startLiveAPI = async () => {
    setIsLiveActive(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let nextStartTime = 0;
    const outCtx = new AudioContext({ sampleRate: 24000 });
    const inCtx = new AudioContext({ sampleRate: 16000 });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sources = new Set<AudioBufferSourceNode>();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const processor = inCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor);
            processor.connect(inCtx.destination);
          },
          onmessage: async (msg) => {
            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              nextStartTime = Math.max(nextStartTime, outCtx.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audio), outCtx, 24000, 1);
              const node = outCtx.createBufferSource();
              node.buffer = buffer;
              node.connect(outCtx.destination);
              node.start(nextStartTime);
              nextStartTime += buffer.duration;
              sources.add(node);
            }
          },
          onerror: (e) => console.error("Live Error", e),
          onclose: () => setIsLiveActive(false)
        },
        config: { 
          responseModalities: [Modality.AUDIO],
          systemInstruction: "أنت MBA BOT، مساعد برمجيات خبير. تحدث بوضوح وقدم حلولاً برمجية دقيقة."
        }
      });
    } catch (e) {
      console.error("Mic access denied", e);
      setIsLiveActive(false);
    }
  };

  const renderContent = (msg: Message) => {
    const firstTextPart = msg.parts.find((p): p is { text: string } => 'text' in p);

    return (
      <div className="space-y-4">
        {msg.parts.map((part, i) => {
          if ('inlineData' in part) return <img key={i} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="max-w-full rounded-2xl border border-slate-700 shadow-2xl transition-transform hover:scale-[1.01]" />;
          if (!('text' in part)) return null;
          const fragments = part.text.split(/(```[\s\S]*?```)/g);
          return fragments.map((frag, j) => {
            if (frag.startsWith('```')) {
              const code = frag.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
              const lang = frag.match(/```(\w+)/)?.[1] || '';
              return (
                <div key={j} className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 font-mono text-sm my-4 shadow-inner">
                  <div className="bg-slate-900 px-4 py-2 flex justify-between border-b border-slate-800 text-[10px] uppercase font-bold text-indigo-400 tracking-widest">
                    <span>{lang || 'code'}</span>
                    <button onClick={() => navigator.clipboard.writeText(code)} className="hover:text-white transition-colors flex items-center gap-1">
                      <i className="fas fa-copy"></i> Copy
                    </button>
                  </div>
                  <SyntaxHighlighter language={lang || 'text'} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.25rem' }}>{code}</SyntaxHighlighter>
                </div>
              );
            }
            return <p key={j} className="whitespace-pre-wrap leading-relaxed text-slate-200">{frag}</p>;
          });
        })}
        {msg.role === 'model' && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <button onClick={() => playTTS(firstTextPart?.text || "")} className="text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full flex items-center gap-2 transition-all border border-indigo-500/20">
              <i className="fas fa-volume-up"></i> استماع للشرح
            </button>
            {msg.groundingMetadata?.groundingChunks?.map((chunk: any, idx: number) => chunk.web && (
              <a key={idx} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-all truncate max-w-[200px] flex items-center gap-2">
                <i className="fas fa-link"></i> {chunk.web.title || 'المصدر'}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] relative">
      {showAutoSaveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-bounce flex items-center gap-2">
          <i className="fas fa-check-circle"></i>
          تم الحفظ تلقائياً
        </div>
      )}

      {isLiveActive && (
        <div className="fixed inset-0 bg-slate-950/95 z-[200] flex flex-col items-center justify-center p-8 backdrop-blur-xl animate-fadeIn">
          <div className="relative">
            <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_80px_rgba(79,70,229,0.4)]">
              <i className="fas fa-microphone text-5xl text-white"></i>
            </div>
            <div className="absolute inset-0 w-32 h-32 border-4 border-indigo-400 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="mt-8 text-2xl font-black text-white tracking-[0.2em] uppercase">MBA LIVE</h2>
          <p className="mt-2 text-indigo-400 font-bold animate-pulse">تحدث الآن.. الخبير يستمع إليك</p>
          <button onClick={() => setIsLiveActive(false)} className="mt-12 px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
             <i className="fas fa-phone-slash"></i> إنهاء المحادثة
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fadeIn max-w-lg mx-auto">
            <div className="relative">
              <div className="w-24 h-24 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center text-indigo-500 text-5xl rotate-12 transition-transform hover:rotate-0 duration-500 shadow-inner">
                <i className="fas fa-terminal"></i>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                <i className="fas fa-bolt"></i>
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter">MBA <span className="text-indigo-500">BOT</span></h1>
              <p className="text-slate-400 mt-4 text-lg leading-relaxed">
                مساعدك البرمجي الفائق. يعمل حالياً بوضع <span className="text-amber-500 font-bold">التفكير العميق</span> افتراضياً.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 max-w-[92%] md:max-w-[85%] ${msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}>
            <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm shadow-2xl transition-transform hover:scale-110 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-indigo-400'}`}>
              <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
            </div>
            <div className={`p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.3)] ${msg.role === 'user' ? 'bg-indigo-600/10 border border-indigo-600/30' : 'bg-slate-800/90 border border-slate-700 backdrop-blur-md'}`}>
              {renderContent(msg)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 animate-pulse ml-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-lg"><i className="fas fa-brain animate-spin"></i></div>
            <div className="space-y-3 pt-2">
              <div className="h-2 w-32 bg-slate-700 rounded-full"></div>
              <div className="h-2 w-56 bg-slate-800 rounded-full"></div>
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Deep Thinking in Progress...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-8 bg-slate-900/95 border-t border-slate-800/50 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex gap-3 mb-4 overflow-x-auto p-3 scrollbar-hide bg-slate-800/30 rounded-2xl border border-slate-700/50">
              {attachments.map((at, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <img src={`data:${at.mimeType};base64,${at.data}`} className="w-20 h-20 object-cover rounded-2xl border-2 border-indigo-500 shadow-2xl transition-transform group-hover:scale-105" />
                  <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-600 text-white w-7 h-7 rounded-full text-xs shadow-xl flex items-center justify-center hover:bg-red-700 transition-colors border-2 border-slate-900"><i className="fas fa-times"></i></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-slate-800/90 border border-slate-700 rounded-[2.5rem] p-2 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-4 w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all ${isSettingsOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50'}`} title="الإعدادات المتقدمة">
              <i className="fas fa-sliders-h text-xl"></i>
            </button>

            <button onClick={startLiveAPI} className="p-4 w-14 h-14 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all rounded-[1.5rem] hover:bg-slate-700/50" title="المحادثة الصوتية الحية">
              <i className="fas fa-microphone-lines text-xl"></i>
            </button>

            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
              const files = Array.from(e.target.files || []) as File[];
              files.forEach(f => {
                const r = new FileReader();
                r.onload = (ev) => setAttachments(p => [...p, { data: (ev.target?.result as string).split(',')[1], mimeType: f.type }]);
                r.readAsDataURL(f);
              });
              e.target.value = "";
            }} multiple accept="image/*" />
            
            <button onClick={() => fileInputRef.current?.click()} className="p-4 w-14 h-14 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all rounded-[1.5rem] hover:bg-slate-700/50" title="إرفاق صور برمجية">
              <i className="fas fa-paperclip text-xl"></i>
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="صف المشكلة البرمجية أو الكود المطلوب..."
              className="flex-1 bg-transparent border-none py-4 px-4 text-white placeholder-slate-500 focus:outline-none resize-none h-14 max-h-48 text-sm md:text-base font-medium"
            />
            
            <button onClick={handleSend} disabled={(!input.trim() && attachments.length === 0) || isLoading} className={`p-4 w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all shadow-xl ${(!input.trim() && attachments.length === 0) || isLoading ? 'bg-slate-700 text-slate-500' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 hover:shadow-indigo-600/40 shadow-indigo-600/20'}`}>
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-xl`}></i>
            </button>
          </div>

          <div className="flex flex-wrap gap-5 px-8 mt-5 text-[10px] font-black uppercase tracking-[0.15em]">
            <button onClick={() => setUiState(p => ({ ...p, isThinking: !p.isThinking }))} className={`flex items-center gap-2 transition-all group ${uiState.isThinking ? 'text-amber-500' : 'text-slate-500'}`}>
              <i className={`fas fa-lightbulb ${uiState.isThinking ? 'animate-pulse' : ''}`}></i> 
              Thinking Mode {uiState.isThinking ? '(ON)' : '(OFF)'}
            </button>
            <button onClick={() => setUiState(p => ({ ...p, useSearch: !p.useSearch }))} className={`flex items-center gap-2 transition-all ${uiState.useSearch ? 'text-blue-500' : 'text-slate-500'}`}>
              <i className="fas fa-search"></i> Search Grounding
            </button>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-scaleUp" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3"><i className="fas fa-microchip text-indigo-500"></i> تخصيص الخبير</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-3">
              {[
                { id: 'general', icon: 'fa-robot', label: 'General Software Engineer' },
                { id: 'backend', icon: 'fa-server', label: 'Backend Architecture Specialist' },
                { id: 'frontend', icon: 'fa-paint-brush', label: 'Frontend & UX Architect' },
                { id: 'data', icon: 'fa-database', label: 'Data Science & Analytics' },
                { id: 'security', icon: 'fa-shield-halved', label: 'Cybersecurity Expert' }
              ].map(role => (
                <button key={role.id} onClick={() => { setUiState(p => ({ ...p, expertRole: role.id })); setIsSettingsOpen(false); }} className={`w-full p-4 rounded-2xl text-right transition-all border flex items-center gap-4 ${uiState.expertRole === role.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${uiState.expertRole === role.id ? 'bg-indigo-600 text-white' : 'bg-slate-700'}`}>
                    <i className={`fas ${role.icon}`}></i>
                  </div>
                  <span className="font-black text-xs md:text-sm">{role.label}</span>
                  {uiState.expertRole === role.id && <i className="fas fa-check-circle ml-auto text-indigo-400"></i>}
                </button>
              ))}
            </div>
            <p className="mt-8 text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest leading-relaxed">تغيير التخصص يساعد البوت على التركيز في سياق برمجي محدد</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
