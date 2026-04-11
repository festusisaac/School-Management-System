import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { 
  MapPin,
  Globe,
  ChevronRight, 
  Menu, 
  X,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';

import NoticeBar from '../common/NoticeBar';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { settings, getFullUrl } = useSystem();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const schoolName = settings?.schoolName || 'YOUR SCHOOL';
  const logoUrl = settings?.primaryLogo ? getFullUrl(settings.primaryLogo) : null;
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Comprehensive school navigation links
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/#about' },
    { name: 'Academics', href: '/academics' },
    { name: 'Admissions', href: '/admission' },
    { name: 'News & Events', href: '/news' },
    { name: 'Gallery', href: '/gallery' },
  ];

  const isLinkActive = (href: string) => {
    if (href.startsWith('/#')) return isHomePage && location.hash === href.replace('/', '');
    return location.pathname === href;
  };

  const headerClass = isHomePage 
    ? (isScrolled ? 'glass-nav py-4' : 'bg-transparent py-8')
    : 'glass-nav py-4 bg-white/95 dark:bg-slate-900/95 shadow-sm border-b border-slate-100 dark:border-slate-800';

  const textClass = isHomePage 
    ? (isScrolled ? 'text-slate-900 dark:text-white' : 'text-white')
    : 'text-slate-900 dark:text-white';

  const navTextClass = isHomePage 
    ? (isScrolled ? 'text-slate-600 dark:text-slate-400' : 'text-slate-200')
    : 'text-slate-600 dark:text-slate-400';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500">
      
      {/* Dynamic Announcement Bar */}
      <NoticeBar />

      {/* Navigation */}
      <nav className={`${isHomePage && !isScrolled ? 'absolute' : 'fixed'} w-full z-50 transition-all duration-500 ${headerClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center gap-3 group">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="relative h-10 w-10 md:h-12 md:w-12 object-contain transition-transform group-hover:scale-110" />
                ) : (
                  <div className="relative h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {schoolName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm md:text-base font-heading font-black tracking-tight transition-colors duration-300 line-clamp-2 leading-tight ${textClass}`}>
                  {schoolName}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-60 ${textClass}`}>
                
                </span>
              </div>
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                // Use <a> for hash links or Home to ensure proper loading/scrolling
                if (link.href === '/' || link.href.includes('#')) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      className={`text-sm font-medium transition-all relative group py-2 
                        ${active ? 'text-primary-600' : navTextClass}
                        hover:text-primary-600`}
                    >
                      {link.name}
                      <span className={`absolute bottom-0 left-0 h-0.5 bg-primary-600 transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`text-sm font-medium transition-all relative group py-2 
                      ${active ? 'text-primary-600' : navTextClass}
                      hover:text-primary-600`}
                  >
                    {link.name}
                    {/* Activity Indicator Line */}
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-primary-600 transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </Link>
                );
              })}
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-primary-500/25 flex items-center gap-2"
              >
                Access Portal <ChevronRight size={16} />
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button 
              className={`md:hidden p-2 rounded-lg ${textClass}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl animate-fade-in transition-colors duration-300">
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                if (link.href === '/' || link.href.includes('#')) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all
                        ${active 
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all
                      ${active 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <Link
                to="/login"
                className="block w-full bg-primary-600 text-white text-center py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login to Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className={isHomePage ? "" : "pt-20"}>
        {children}
      </main>

      {/* Modern Premium Footer */}
      <footer className="bg-white dark:bg-slate-950 pt-24 pb-12 border-t border-slate-100 dark:border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {/* Column 1: Brand & Identity */}
            <div className="space-y-8">
              <a href="/" className="inline-flex items-center gap-3.5 group">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain transition-transform group-hover:scale-110" />
                ) : (
                  <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold">{schoolName.charAt(0)}</div>
                )}
                <span className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">{schoolName}</span>
              </a>
              <div className="space-y-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium italic">
                  "{settings?.schoolMotto || 'Integrity, Diligence and Service'}"
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-1">Affiliation</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                     Poor Handmaids of the Jesus Christ (PHJC)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Column 2: Quick Explore */}
            <div className="space-y-8">
              <h5 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Quick Links</h5>
              <div className="grid grid-cols-1 gap-4">
                {navLinks.map((link) => {
                  if (link.href === '/' || link.href.includes('#')) {
                    return (
                      <a 
                        key={link.name} 
                        href={link.href} 
                        className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center gap-2 group"
                      >
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        {link.name}
                      </a>
                    );
                  }
                  return (
                    <Link 
                      key={link.name} 
                      to={link.href} 
                      className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center gap-2 group"
                    >
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      {link.name}
                    </Link>
                  );
                })}
                <Link to="/admission" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center gap-2 group">
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  Admission
                </Link>
              </div>
            </div>

            {/* Column 3: Contact Details */}
            <div className="space-y-8">
              <h5 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Contact Us</h5>
              <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="shrink-0 w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600">
                      <MapPin size={18} />
                   </div>
                   <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                     {settings?.schoolAddress || 'School Address not set'}
                   </p>
                </div>
                <div className="flex gap-4">
                   <div className="shrink-0 w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                      <Phone size={18} />
                   </div>
                   <div className="flex flex-col">
                      <p className="text-xs font-black uppercase text-slate-400 mb-0.5 tracking-wider">Phone Number</p>
                      <a href={`tel:${settings?.schoolPhone}`} className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors">
                        {settings?.schoolPhone || 'N/A'}
                      </a>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="shrink-0 w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                      <Mail size={18} />
                   </div>
                   <div className="flex flex-col">
                      <p className="text-xs font-black uppercase text-slate-400 mb-0.5 tracking-wider">Email Address</p>
                      <a href={`mailto:${settings?.schoolEmail}`} className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors">
                        {settings?.schoolEmail || 'N/A'}
                      </a>
                   </div>
                </div>
              </div>
            </div>

            {/* Column 4: Stay Connected */}
            <div className="space-y-8">
              <h5 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Stay Connected</h5>
              <div className="space-y-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Join our official social community for real-time news and highlights.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Facebook, href: settings?.socialFacebook },
                    { icon: Twitter, href: settings?.socialTwitter },
                    { icon: Instagram, href: settings?.socialInstagram },
                    { icon: Linkedin, href: settings?.socialLinkedin },
                    { icon: Youtube, href: settings?.socialYoutube },
                    { icon: Globe, href: settings?.officialWebsite }
                  ].filter(s => s.href).map((social, i) => (
                    <a 
                      key={i} 
                      href={social.href} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary-600 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center transition-all shadow-sm group active:scale-95"
                    >
                      <social.icon size={20} className="transition-transform group-hover:scale-110" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright Area */}
          <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
              © {new Date().getFullYear()} {schoolName}. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-8">
               <a href="/privacy" className="text-[10px] font-black uppercase text-slate-400 hover:text-primary-600 tracking-widest">Privacy Policy</a>
               <a href="/terms" className="text-[10px] font-black uppercase text-slate-400 hover:text-primary-600 tracking-widest">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
