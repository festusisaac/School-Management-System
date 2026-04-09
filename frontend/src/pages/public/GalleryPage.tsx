import { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { 
  Globe, 
  Heart, 
  Users, 
  Image as ImageIcon,
  Search,
  ChevronRight,
  Filter
} from 'lucide-react';

// Fallback Assets (Matching LandingPage)
import campus1 from '@assets/phjcschool/image1.jpeg';
import campus2 from '@assets/phjcschool/image10.jpeg';
import campus3 from '@assets/phjcschool/image29.jpeg';
import faith1 from '@assets/phjcschool/image58.jpeg';
import faith2 from '@assets/phjcschool/image79.jpeg';
import faith3 from '@assets/phjcschool/image59.jpeg';
import activity1 from '@assets/phjcschool/image2.jpeg';
import activity2 from '@assets/phjcschool/image33.jpeg';
import activity3 from '@assets/phjcschool/image31.jpeg';

import cmsService, { CmsPublicInit } from '../../services/cms.service';

const GalleryPage = () => {
  const { getFullUrl } = useSystem();
  const [cmsData, setCmsData] = useState<CmsPublicInit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await cmsService.getPublicInit();
        setCmsData(data);
      } catch (error) {
        console.error('Failed to fetch gallery data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, []);

  // Standard category mapping for consistent slugs
  const standardCategoryMap: Record<string, string> = {
    'the campus': 'campus',
    'campus': 'campus',
    'spirituality': 'spirituality',
    'faith': 'spirituality',
    'activities': 'activities',
    'extra-curriculars': 'activities',
    'extra curriculars': 'activities'
  };

  const getCategorySlug = (cat?: string) => {
    const safeCat = (cat || 'Uncategorized').trim();
    return standardCategoryMap[safeCat.toLowerCase()] || safeCat.toLowerCase().replace(/\s+/g, '-');
  };

  // Process dynamic categories from CMS
  const cmsCategories = Array.from(new Set((cmsData?.gallery || []).map(i => i.category))).filter(Boolean);
  
  const tabs = [
    { id: 'all', name: 'All Photos', icon: ImageIcon },
    ...(cmsCategories.length > 0 
      ? cmsCategories.map(cat => {
          const safeCat = (cat || 'Uncategorized').toLowerCase();
          return {
            id: getCategorySlug(cat),
            name: cat || 'Uncategorized',
            icon: safeCat.includes('campus') ? Globe : 
                  safeCat.includes('spirituality') ? Heart : 
                  safeCat.includes('activity') ? Users : ImageIcon
          };
        })
      : [
          { id: 'campus', name: 'The Campus', icon: Globe },
          { id: 'spirituality', name: 'Spirituality', icon: Heart },
          { id: 'activities', name: 'Extra-Curriculars', icon: Users },
        ]
    )
  ];

  // Logic to build the final list of items (CMS + Fallbacks if needed)
  const getFilteredItems = () => {
    let items = cmsData?.gallery || [];
    
    // If no CMS items at all, use fallbacks
    if (items.length === 0) {
      items = [
        { id: 1, imageUrl: campus1, title: 'Modern Classrooms', category: 'The Campus' },
        { id: 2, imageUrl: campus2, title: 'Computer Laboratory', category: 'The Campus' },
        { id: 3, imageUrl: campus3, title: 'School Library', category: 'The Campus' },
        { id: 4, imageUrl: faith1, title: 'Morning Prayer', category: 'Spirituality' },
        { id: 5, imageUrl: faith2, title: 'Catholic Heritage', category: 'Spirituality' },
        { id: 6, imageUrl: faith3, title: 'Community Service', category: 'Spirituality' },
        { id: 7, imageUrl: activity1, title: 'JET Club Projects', category: 'Activities' },
        { id: 8, imageUrl: activity2, title: 'Inter-House Sports', category: 'Activities' },
        { id: 9, imageUrl: activity3, title: 'Cultural Day Celebrations', category: 'Activities' },
      ] as any[];
    }

    return items.filter(item => {
      const matchesTab = activeTab === 'all' || getCategorySlug(item.category) === activeTab;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  };

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500">
      <main className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Heading */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/20">
              <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">Life at School</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 dark:text-white leading-tight">
              Our <span className="text-primary-600">Gallery</span> Archive
            </h1>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Explore the vibrant culture, spiritual heritage, and academic excellence that define our school community through pictures.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-16 space-y-8 transition-colors">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Search */}
              <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search gallery..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-8 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-medium text-slate-700 dark:text-slate-300" 
                />
              </div>

              {/* Tabs / Filters Icons Header */}
              <div className="hidden lg:flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <Filter size={14} /> Quick Filters
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                    activeTab === tab.id
                      ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/20 scale-105'
                      : 'bg-white dark:bg-slate-950 border-slate-50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-primary-500/30 hover:text-primary-600'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {filteredItems.map((item, index) => (
                <div 
                  key={index} 
                  className="group relative h-[28rem] rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-5"
                  style={{ animationDelay: `${(index % 6) * 100}ms` }}
                >
                  <img 
                    src={item.imageUrl?.startsWith('blob:') || item.imageUrl?.startsWith('data:') ? item.imageUrl : item.imageUrl ? getFullUrl(item.imageUrl) : ''} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  {/* Premium Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-8 pt-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className="flex flex-col items-start translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1 shadow-sm">
                        {item.category}
                      </span>
                      <h5 className="text-2xl font-black text-white leading-tight drop-shadow-md">
                        {item.title}
                      </h5>
                    </div>
                  </div>
                  
                  {/* View Details Hover Badge */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full text-white">
                      <ImageIcon size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto mb-8">
                <ImageIcon size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">No images match your criteria</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Try adjusting your filters or search terms.</p>
              <button 
                onClick={() => {setActiveTab('all'); setSearchQuery('');}}
                className="mt-8 text-primary-600 font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all"
              >
                Reset Filters <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Call to Action */}
          <section className="mt-40 bg-slate-900 rounded-[3.5rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl transition-all duration-1000">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-600/20 to-secondary-600/10 z-0"></div>
             <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                <h3 className="text-3xl md:text-5xl font-heading font-black text-white leading-tight">
                  Be Part of Our <span className="text-primary-400">Next Story</span>
                </h3>
                <p className="text-slate-300 text-lg font-medium opacity-90 leading-relaxed">
                  Join a community dedicated to academic rigor and moral excellence. Your child's future begins here.
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-4">
                  <a href="/admission" className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 active:scale-95">Apply for Admission</a>
                  <a href="/#contact" className="px-10 py-4 bg-white/10 text-white border border-white/20 backdrop-blur-md rounded-2xl font-black text-base hover:bg-white/20 transition-all active:scale-95">Get In Touch</a>
                </div>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default GalleryPage;
