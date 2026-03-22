import { Link } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { BookOpen, ImageIcon, Heart, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const { settings } = useSystem();
  const schoolName = settings?.schoolName || 'Catholic School';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-900 text-white p-2 rounded flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-blue-950">
                {schoolName}
              </span>
            </div>
            
            {/* Action */}
            <div>
              <Link
                to="/login"
                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-md font-medium transition-colors text-sm shadow-sm flex items-center gap-2"
              >
                Access Portal <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold tracking-wide uppercase border border-amber-200">
                <Heart size={14} className="text-amber-600" />
                <span>Faith • Virtue • Knowledge</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">
                Welcome to <br /> {schoolName}
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Dedicated to academic excellence and moral formation within the Catholic tradition. We nurture the whole person—mind, body, and spirit.
              </p>
              
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white px-8 py-3.5 rounded-md font-medium transition-colors shadow-md text-base"
                >
                  Student & Parent Login
                </Link>
              </div>
            </div>

            {/* Right Image Space */}
            <div className="relative">
              {/* Main Image Placeholder */}
              <div className="bg-slate-200 aspect-video md:aspect-[4/3] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden shadow-sm relative">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <span className="font-medium">Hero Image Space</span>
                <span className="text-xs mt-1">Suggested: Main School Building or Chapel</span>
              </div>
            </div>

          </div>
        </div>

        {/* Feature/Values Divider Section with Images */}
        <div className="bg-white border-y border-slate-200 py-16 md:py-20 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
             <h2 className="text-3xl font-serif font-bold text-slate-900">Our Core Pillars</h2>
             <div className="w-16 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="flex flex-col text-center">
              <div className="bg-slate-100 aspect-square rounded-md border border-slate-200 flex flex-col items-center justify-center text-slate-400 mb-6 overflow-hidden">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Faith Image</span>
              </div>
              <h3 className="text-xl font-serif font-semibold text-slate-900 mb-2">Spiritual Growth</h3>
              <p className="text-slate-600 leading-relaxed text-sm px-4">
                Fostering a deep, enduring relationship with God through daily prayer, sacraments, and moral teachings.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col text-center">
              <div className="bg-slate-100 aspect-square rounded-md border border-slate-200 flex flex-col items-center justify-center text-slate-400 mb-6 overflow-hidden">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Academics Image</span>
              </div>
              <h3 className="text-xl font-serif font-semibold text-slate-900 mb-2">Academic Excellence</h3>
              <p className="text-slate-600 leading-relaxed text-sm px-4">
                Providing a rigorous, classical curriculum that cultivates wisdom, critical thinking, and a lifelong love of learning.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col text-center">
              <div className="bg-slate-100 aspect-square rounded-md border border-slate-200 flex flex-col items-center justify-center text-slate-400 mb-6 overflow-hidden">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Community Image</span>
              </div>
              <h3 className="text-xl font-serif font-semibold text-slate-900 mb-2">Virtuous Community</h3>
              <p className="text-slate-600 leading-relaxed text-sm px-4">
                Building a supportive environment where students lead by example and serve others with charity and grace.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-slate-500" />
            <span className="font-serif text-lg font-semibold text-slate-300">{schoolName}</span>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
