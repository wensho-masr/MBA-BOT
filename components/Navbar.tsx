
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  isLoading: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isLoading }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/', label: 'المحادثة', icon: 'fa-comments' },
    { path: '/history', label: 'السجل', icon: 'fa-history' },
    { path: '/about', label: 'عن البوت', icon: 'fa-info-circle' },
  ];

  const handleNewChat = () => {
    navigate('/');
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2 space-x-reverse">
            <div className="bg-indigo-600 p-2 rounded-lg relative overflow-hidden">
              <i className="fas fa-robot text-xl"></i>
              {isLoading && (
                <div className="absolute inset-0 bg-indigo-400/20 animate-pulse"></div>
              )}
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">MBA <span className="text-indigo-400">BOT</span></span>
          </Link>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="hidden sm:flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl transition-all font-bold text-sm"
          >
            <i className="fas fa-plus"></i>
            محادثة جديدة
          </button>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Subtle Loading Animation */}
          {isLoading && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-fadeIn">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Processing</span>
            </div>
          )}

          <div className="flex gap-2 sm:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                  location.pathname === link.path && !location.search
                    ? 'text-indigo-400 bg-slate-700/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <i className={`fas ${link.icon}`}></i>
                <span className="hidden sm:inline font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
          
          {/* Mobile New Chat Icon */}
          <button
            onClick={handleNewChat}
            className="sm:hidden w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-lg text-white"
            title="محادثة جديدة"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
