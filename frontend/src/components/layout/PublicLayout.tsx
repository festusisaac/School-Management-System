import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { 
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

  // Update navLinks to use absolute paths so they work from sub-pages
  const navLinks = [
    { name: 'About', href: '/#about' },
    { name: 'Academics', href: '/#academics' },
    { name: 'Admissions', href: '/#admissions' },
    { name: 'Student Life', href: '/#student-life' },
    { name: 'Portal', href: '/login' },
  ];

  const headerClass = isHomePage 
    ? (isScrolled ? 'glass-nav py-4' : 'bg-transparent py-8')
    : 'glass-nav py-4 bg-white/95 dark:bg-slate-900/95 shadow-sm border-b border-slate-100 dark:border-slate-800';

  const textClass = isHomePage 
    ? (isScrolled ? 'text-slate-900 dark:text-white' : 'text-white')
    : 'text-slate-900 dark:text-white';

  const navTextClass = isHomePage 
    ? (isScrolled ? 'text-slate-600 dark:text-slate-400' : 'text-slate-200')
    : 'text-slate-600 dark:text-slate-400';

  // Navigation top offset depends on if NoticeBar is showing
  // Since NoticeBar is relative and at top, the fixed nav with top-0 will overlap it unless we adjust.
  // Actually, we can just wrap both in a container or make nav sticky.
  // Let's make the entire header section sticky.

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500">
      
      {/* Dynamic Announcement Bar */}
      <NoticeBar />

      {/* Navigation */}
      <nav className={`${isHomePage && !isScrolled ? 'absolute' : 'fixed'} w-full z-50 transition-all duration-500 ${headerClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group max-w-[45%]">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="relative h-10 w-10 object-contain" />
                ) : (
                  <div className="relative h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {schoolName.charAt(0)}
                  </div>
                )}
              </div>
              <span className={`font-heading text-sm md:text-base font-bold tracking-tight transition-colors duration-300 line-clamp-2 leading-tight ${textClass}`}>
                {schoolName}
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium hover:text-primary-600 transition-colors ${navTextClass}`}
                >
                  {link.name}
                </a>
              ))}
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
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-base font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
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

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 pt-24 pb-12 border-t border-slate-100 dark:border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-3 group">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {schoolName.charAt(0)}
                  </div>
                )}
                <span className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                  {schoolName}
                </span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Dedicated to academic excellence and moral formation, preparing the next generation of leaders with honesty, service, and honor.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href={`tel:${settings?.schoolPhone}`}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                >
                  <Phone size={18} />
                </a>
                <a 
                  href={`mailto:${settings?.schoolEmail}`}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>
            
            <div className="space-y-6">
              <h5 className="font-heading font-bold text-lg text-slate-900 dark:text-white">Quick Links</h5>
              <ul className="space-y-4 text-slate-500 dark:text-slate-400 font-medium">
                <li><a href="/#about" className="hover:text-primary-600 transition-colors">About Us</a></li>
                <li><a href="/#academics" className="hover:text-primary-600 transition-colors">Academics</a></li>
                <li><a href="/#admissions" className="hover:text-primary-600 transition-colors">Admissions</a></li>
                <li><a href="/#student-life" className="hover:text-primary-600 transition-colors">Student Life</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-heading font-bold text-lg text-slate-900 dark:text-white">Social Connect</h5>
              <p className="text-sm text-slate-500 dark:text-slate-400">Follow us on our social platforms for real-time updates.</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Facebook, href: settings?.socialFacebook },
                  { icon: Twitter, href: settings?.socialTwitter },
                  { icon: Instagram, href: settings?.socialInstagram },
                  { icon: Linkedin, href: settings?.socialLinkedin },
                  { icon: Youtube, href: settings?.socialYoutube }
                ].filter(s => s.href).map((social, i) => (
                  <a 
                    key={i} 
                    href={social.href} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-10 h-10 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-primary-600 rounded-xl flex items-center justify-center transition-all shadow-sm"
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
              © {new Date().getFullYear()} {schoolName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
