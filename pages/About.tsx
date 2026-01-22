
import React from 'react';

const About: React.FC = () => {
  const sections = [
    {
      title: "ما هو MBA BOT؟",
      content: "MBA BOT هو مساعد برمجيات متقدم يعتمد على تقنيات Google Gemini 3 Pro. تم تصميمه خصيصاً لمساعدة المبرمجين في كتابة الأكواد، حل المشاكل البرمجية المعقدة، وتقديم شروحات تقنية دقيقة.",
      icon: "fa-brain",
      color: "bg-blue-500/20 text-blue-400"
    },
    {
      title: "لماذا تختارنا؟",
      content: "على عكس الشات بوت العام، MBA BOT يركز 100% على الكود. هذا يعني دقة أعلى في المنطق البرمجي، التزاماً بأحدث المعايير البرمجية، وفهماً أعمق لبنية اللغات المختلفة.",
      icon: "fa-code",
      color: "bg-indigo-500/20 text-indigo-400"
    },
    {
      title: "من يمكنه الاستفادة؟",
      content: "سواء كنت مبتدئاً تتعلم لغتك الأولى، أو مهندساً خبيراً يبحث عن تحسين الأداء (Refactoring)، فإن MBA BOT هو شريكك المثالي في رحلة البرمجة.",
      icon: "fa-users",
      color: "bg-emerald-500/20 text-emerald-400"
    }
  ];

  const socialLinks = [
    {
      name: "فيسبوك",
      url: "https://www.facebook.com/share/17tWibfpg9/",
      icon: "fa-facebook-f",
      color: "hover:bg-blue-600 shadow-blue-500/20"
    },
    {
      name: "انستجرام",
      url: "https://www.instagram.com/blacklliister",
      icon: "fa-instagram",
      color: "hover:bg-pink-600 shadow-pink-500/20"
    },
    {
      name: "تليجرام",
      url: "https://t.me/wenshmaasr_",
      icon: "fa-telegram",
      color: "hover:bg-sky-500 shadow-sky-400/20"
    },
    {
      name: "واتساب",
      url: "https://wa.me/201033706353",
      icon: "fa-whatsapp",
      color: "hover:bg-green-500 shadow-green-400/20"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn scrollbar-hide">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight">
          قوة الذكاء الاصطناعي في خدمة <span className="text-indigo-500">المبرمجين</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          نحن نوفر لك الأدوات والخبرة اللازمة لتحويل أفكارك إلى أكواد حقيقية في ثوانٍ معدودة.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 mb-16">
        {sections.map((section, idx) => (
          <div 
            key={idx}
            className="bg-slate-800/40 border border-slate-700 p-8 rounded-[2rem] flex flex-col md:flex-row gap-6 items-start hover:border-indigo-500/50 transition-all group backdrop-blur-sm"
          >
            <div className={`p-4 rounded-2xl ${section.color} text-2xl group-hover:scale-110 transition-transform shadow-lg`}>
              <i className={`fas ${section.icon}`}></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">{section.title}</h2>
              <p className="text-slate-400 leading-relaxed text-lg font-medium">{section.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-black text-white text-center mb-8 tracking-widest uppercase">تواصل معنا</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center p-6 bg-slate-800/50 border border-slate-700 rounded-3xl transition-all ${link.color} hover:text-white group hover:scale-105 active:scale-95 shadow-xl`}
            >
              <i className={`fab ${link.icon} text-3xl mb-3 text-slate-400 group-hover:text-white transition-colors`}></i>
              <span className="text-sm font-bold tracking-wider">{link.name}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/60 to-slate-800/60 border border-indigo-500/30 p-10 rounded-[3rem] text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <h3 className="text-3xl font-black text-white mb-4 tracking-tight">هل أنت مستعد للبدء؟</h3>
        <p className="text-slate-300 mb-8 font-medium">انضم إلى آلاف المبرمجين الذين يطورون مشاريعهم بمساعدة MBA BOT.</p>
        <a 
          href="#/" 
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-12 rounded-full transition-all shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95"
        >
          ابدأ المحادثة الآن
        </a>
      </div>
    </div>
  );
};

export default About;
