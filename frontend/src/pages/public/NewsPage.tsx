import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { 
  ChevronRight,
  Search, 
  ArrowRight, 
  Mail, 
  Calendar, 
  User, 
  ChevronDown
} from 'lucide-react';

// News Assets
import news1 from '@assets/phjcschool/image80.jpeg';
import news2 from '@assets/phjcschool/image84.jpeg';
import news3 from '@assets/phjcschool/image88.jpeg';
import news4 from '@assets/phjcschool/image95.jpeg';
import news5 from '@assets/phjcschool/image6.jpeg';
import news6 from '@assets/phjcschool/image29.jpeg';

const NewsPage = () => {
  const { settings, getFullUrl } = useSystem();
  const schoolName = settings?.schoolName || 'YOUR SCHOOL';
  const logoUrl = settings?.primaryLogo ? getFullUrl(settings.primaryLogo) : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Academic', 'Sports', 'Events', 'Notices', 'Achievement'];

  const allNews = [
    {
      id: 1,
      slug: 'annual-inter-house-sports-2026',
      img: news1,
      tag: 'Sports',
      date: 'March 24, 2026',
      title: 'Annual Inter-House Sports Highlights',
      author: 'Sports Dept.',
      snippet: 'Relive the excitement of our students\' sportsmanship and team spirit during this year\'s athletic competition. Blue House emerged as the overall winner after a series of intense track and field events.'
    },
    {
      id: 2,
      slug: 'waec-results-success-2025',
      img: news2,
      tag: 'Achievement',
      date: 'March 15, 2026',
      title: '100% Success Rate in WAEC 2025',
      author: 'Admin',
      snippet: 'Celebrating our senior students\' remarkable academic achievement and a flawless pass rate in national exams. Over 80% of our students achieved distinctions in Mathematics and English Language.'
    },
    {
      id: 3,
      slug: 'second-term-resumption-notice',
      img: news3,
      tag: 'Notices',
      date: 'April 02, 2026',
      title: '2nd Term Resumption Notice',
      author: 'Principal',
      snippet: 'Important dates and preparations for the upcoming academic session. We look forward to welcoming our students back for another productive term of learning and growth.'
    },
    {
      id: 4,
      slug: 'new-computer-lab-inauguration',
      img: news4,
      tag: 'Events',
      date: 'February 28, 2026',
      title: 'Inauguration of the New High-Tech Computer Lab',
      author: 'Admin',
      snippet: 'Our commitment to digital literacy takes a giant leap forward with the opening of our state-of-the-art computer center, equipped with the latest workstations and high-speed internet.'
    },
    {
      id: 5,
      slug: 'pfa-meeting-general-assembly',
      img: news5,
      tag: 'Events',
      date: 'February 10, 2026',
      title: 'Parents-Teachers-Association General Assembly',
      author: 'PFA Secretary',
      snippet: 'A successful gathering of parents and staff to discuss the school\'s development plan for the second half of the year. Key resolutions were reached regarding student transportation and extra-curricular support.'
    },
    {
      id: 6,
      slug: 'library-expansion-project',
      img: news6,
      tag: 'Achievement',
      date: 'January 15, 2026',
      title: 'School Library Expansion Project Completed',
      author: 'Librarian',
      snippet: 'Increased seating capacity and over 500 new titles added to our school library. The new "Quiet Study Zone" is now officially open for senior students preparing for exams.'
    }
  ];

  const filteredNews = allNews.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          news.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || news.tag === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs for News */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold text-sm transition-all group">
              <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Home
            </Link>
          </div>

          {/* Page Heading */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/20">
              <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">The Archive</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 dark:text-white leading-tight">
              News & <span className="text-primary-600">Announcements</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Stay updated with the latest happenings, celebrated milestones, and important notices from our vibrant school community.
            </p>
          </div>

          {/* Control Bar (Search & Filter) */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-16 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Search */}
            <div className="relative w-full lg:max-w-md group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-8 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-medium text-slate-700 dark:text-slate-300" 
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 border-2 ${
                    activeCategory === cat
                      ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/20 scale-105'
                      : 'bg-white dark:bg-slate-950 border-slate-50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-primary-500/30 hover:text-primary-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* News Feed Grid */}
          {filteredNews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredNews.map((news) => (
                <Link 
                   key={news.id} 
                   to={`/news/${news.slug}`}
                   className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 shadow-sm hover:shadow-2xl transition-all duration-700 border border-slate-100 dark:border-slate-800 flex flex-col h-full"
                >
                   <div className="relative h-64 mb-8 overflow-hidden rounded-[1.5rem]">
                     <img 
                       src={news.img} 
                       alt={news.title} 
                       className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                     />
                     <div className="absolute top-4 left-4">
                       <span className="bg-primary-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm">{news.tag}</span>
                     </div>
                   </div>
                   
                   <div className="flex flex-col flex-grow px-4 space-y-4">
                     <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                       <div className="flex items-center gap-1.5"><Calendar size={14} /> {news.date}</div>
                     </div>
                     <h4 className="text-xl font-heading font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                       {news.title}
                     </h4>
                     <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6">
                       {news.snippet}
                     </p>
                     
                     <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                           <User size={12} />
                         </div>
                         <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{news.author}</span>
                       </div>
                       <span className="text-xs font-bold text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                         Read Story <ChevronRight size={14} />
                       </span>
                     </div>
                   </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No articles found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search or category filters.</p>
            </div>
          )}

          {/* Newsletter Signup */}
          <section className="mt-40 bg-primary-600 rounded-[3.5rem] p-8 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary-500/20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative space-y-8 max-w-2xl mx-auto">
              <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center text-white backdrop-blur-md mx-auto shadow-xl border border-white/20">
                <Mail size={36} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-heading font-black text-white leading-tight">
                  Join Our Newsletter
                </h2>
                <p className="text-primary-100 text-lg font-medium opacity-90 leading-relaxed">
                  Get the latest stories, achievements, and important announcements delivered straight to your inbox.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-3xl border border-white/20">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-grow px-6 py-4 bg-transparent border-none rounded-2xl text-white placeholder:text-white/50 focus:ring-0 font-medium"
                />
                <button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-2xl font-black text-base transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3">
                  Subscribe <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default NewsPage;
