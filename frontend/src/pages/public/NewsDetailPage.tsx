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

import news1 from '@assets/phjcschool/image80.jpeg';

import cmsService, { CmsNews } from '../../services/cms.service';

const NewsDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { settings, getFullUrl } = useSystem();
  const [allNews, setAllNews] = useState<CmsNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await cmsService.getPublicNews();
        setAllNews(data);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const news = allNews.find(n => n.slug === slug);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const relatedNews = allNews.filter(n => n.slug !== slug).slice(0, 3);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Article not found</h2>
        <Link to="/news" className="text-primary-600 font-bold hover:underline">Back to News</Link>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic Progress Bar */}
      <div className="fixed top-20 left-0 w-full h-1 z-50 bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: '0%' }}></div>
      </div>

      <main className="pt-10">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Metadata */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-3">
              <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary-100 dark:border-primary-800/20">
                {news.tag}
              </span>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(news.date).toLocaleDateString()}</div>
                <div className="flex items-center gap-1.5"><Clock size={14} /> 5 min read</div>
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
          {news.imageUrl && (
            <div className="relative aspect-video rounded-[3rem] overflow-hidden mb-16 shadow-2xl shadow-slate-200 dark:shadow-none group">
              <img src={news.imageUrl.startsWith('blob:') ? news.imageUrl : getFullUrl(news.imageUrl)} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-slate prose-lg dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:font-medium mb-24 whitespace-pre-wrap">
            {news.content}
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
                    <img src={related.imageUrl ? (related.imageUrl.startsWith('blob:') ? related.imageUrl : getFullUrl(related.imageUrl)) : news1} alt={related.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
    </>
  );
};

export default NewsDetailPage;
