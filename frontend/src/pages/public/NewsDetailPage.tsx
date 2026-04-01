import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin,
  Copy
} from 'lucide-react';

// Reusing news images for mock detailing
import news1 from '@assets/phjcschool/image80.jpeg';
import news2 from '@assets/phjcschool/image84.jpeg';
import news3 from '@assets/phjcschool/image88.jpeg';

const NewsDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { settings, getFullUrl } = useSystem();
  const schoolName = settings?.schoolName || 'YOUR SCHOOL';
  const logoUrl = settings?.primaryLogo ? getFullUrl(settings.primaryLogo) : null;
  const [copied, setCopied] = useState(false);

  // Mock database search based on slug
  const allNews = [
    {
      id: 1,
      slug: 'annual-inter-house-sports-2026',
      img: news1,
      tag: 'Sports',
      date: 'March 24, 2026',
      title: 'Annual Inter-House Sports Highlights',
      author: 'Sports Dept.',
      readTime: '5 min read',
      content: `The Annual Inter-House Sports competition at PHJC Azhin Kasa came to a thrilling conclusion yesterday, showcasing the incredible athletic talent and sportsmanship of our students. The event, which took place on the main sports field, brought together students, parents, and community members in a celebration of physical excellence and team spirit.

      From the intense 100m sprints to the strategic relay races, every house displayed remarkable determination. Blue House ultimately emerged as the overall champions, narrowly edging out Red House in the final tally of medals.

      "It's not just about winning," said the School Sports Coordinator. "It's about the character built through discipline and the friendships forged in healthy competition. We are immensely proud of every participant who gave their best on the field today."

      The day featured traditional track events, high jump, long jump, and even a novelty race for parents and staff, which added a layer of community joy to the proceedings. Special awards were presented for "Most Disciplined House" and "Top Student Athlete" at the closing ceremony.`
    },
    {
      id: 2,
      slug: 'waec-results-success-2025',
      img: news2,
      tag: 'Achievement',
      date: 'March 15, 2026',
      title: '100% Success Rate in WAEC 2025',
      author: 'Academic Board',
      readTime: '4 min read',
      content: `We are overjoyed to announce that PHJC School Azhin Kasa has achieved a phenomenal 100% pass rate in the 2025 West African Examinations Council (WAEC) senior secondary exams. This milestone achievement is a testament to the hard work of our students, the dedication of our teaching staff, and the unwavering support of our parents.

      Analysis of the results shows that over 80% of our candidates achieved distinctions (A1-B3) in core subjects, including Mathematics, English Language, and Integrated Science. Our science laboratory practicals and intensive exam preparatory classes have clearly paid off, providing our students with a strong competitive edge.

      The Principal, in an official statement, remarked: "At PHJC, we believe every child has the potential for greatness. This result confirms that with the right environment and consistent guidance, our students can compete with the best in the nation. We celebrate the class of 2025 and look forward to their continued success in higher education."`
    },
    {
      id: 3,
      slug: 'second-term-resumption-notice',
      img: news3,
      tag: 'Notices',
      date: 'April 02, 2026',
      title: '2nd Term Resumption Notice',
      author: 'Admin',
      readTime: '3 min read',
      content: `As we prepare to welcome our students back for the 2025/2026 Second Academic Term, the school administration wishes to provide important updates regarding resumption and term activities.

      Resumption Dates: All boarding students are expected back on Sunday, April 12th, by 4:00 PM. Regular classes for both Day and Boarding students will commence promptly at 7:30 AM on Monday, April 13th.

      Requirements: Parents are reminded to ensure all holiday assignments are completed and that students return with the necessary stationery and updated school uniforms. A brief "Welcome Assembly" will be held on the first morning to layout the term's academic and spiritual goals.

      We look forward to another term filled with discovery, growth, and collective achievement as we continue our mission of providing holistic education to our community.`
    }
    // ... other news items would follow
  ];

  const news = allNews.find(n => n.slug === slug) || allNews[0]; // Fallback to first if not found

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const relatedNews = allNews.filter(n => n.id !== news.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 transition-colors duration-500 pb-20">
      
      {/* Dynamic Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: '0%' }}></div>
      </div>

      <header className="fixed w-full z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/news" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold text-sm transition-all group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to News
          </Link>
          
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
            ) : (
              <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                {schoolName.charAt(0)}
              </div>
            )}
            <span className="font-heading font-black text-slate-900 dark:text-white tracking-tight hidden sm:block truncate max-w-[200px]">
              {schoolName}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-32">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Metadata */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-3">
              <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary-100 dark:border-primary-800/20">
                {news.tag}
              </span>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                <div className="flex items-center gap-1.5"><Calendar size={14} /> {news.date}</div>
                <div className="flex items-center gap-1.5"><Clock size={14} /> {news.readTime}</div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              {news.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                  <User size={18} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Story By</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{news.author}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all">
                  <Facebook size={18} />
                </button>
                <button className="w-10 h-10 bg-slate-50 dark:bg-slate-900 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded-xl flex items-center justify-center transition-all">
                  <Twitter size={18} />
                </button>
                <button className="w-10 h-10 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all">
                  <Linkedin size={18} />
                </button>
                <button 
                  onClick={handleCopyLink}
                  className={`w-10 h-10 ${copied ? 'bg-green-50 text-green-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary-600'} rounded-xl flex items-center justify-center transition-all`}
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Feature Image */}
          <div className="relative aspect-video rounded-[3rem] overflow-hidden mb-16 shadow-2xl shadow-slate-200 dark:shadow-none group">
            <img src={news.img} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" />
          </div>

          {/* Article Content */}
          <div className="prose prose-slate prose-lg dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:font-medium mb-24">
            {news.content.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph.trim()}</p>
            ))}
          </div>

          {/* Related Stories */}
          <section className="pt-20 border-t-2 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-heading font-black text-slate-900 dark:text-white">Related Stories</h3>
              <Link to="/news" className="text-primary-600 font-bold text-sm flex items-center gap-2 group">
                View All <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {relatedNews.map((related) => (
                <Link key={related.id} to={`/news/${related.slug}`} className="group space-y-4">
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-sm">
                    <img src={related.img} alt={related.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{related.tag}</span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors leading-tight line-clamp-2">
                      {related.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </article>
      </main>

      <footer className="mt-40 py-20 bg-slate-50 dark:bg-slate-900/50 text-center transition-colors duration-500">
        <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          © {new Date().getFullYear()} {schoolName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default NewsDetailPage;
