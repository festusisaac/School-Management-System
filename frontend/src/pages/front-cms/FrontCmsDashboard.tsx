import React from 'react';
import { 
  Image as ImageIcon, 
  Type, 
  BarChart3, 
  MessageSquare, 
  Grid, 
  Newspaper, 
  BookOpen,
  Megaphone,
  Globe,
  Folder
} from 'lucide-react';
import HeroManager from './sections/HeroManager';
import SectionManager from './sections/SectionManager';
import StatManager from './sections/StatManager';
import ProgramManager from './sections/ProgramManager';
import GalleryManager from './sections/GalleryManager';
import TestimonialManager from './sections/TestimonialManager';
import NewsManager from './sections/NewsManager';
import NoticeManager from './sections/NoticeManager';
import ContactManager from './sections/ContactManager';
import SeoManager from './sections/SeoManager';
import MediaLibrary from './sections/MediaLibrary';
import { useLocation, useNavigate } from 'react-router-dom';

const FrontCmsDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the last part of the path
  const pathParts = location.pathname.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  
  // Default to 'hero' if path is just '/front-cms'
  const activeTab = ['hero', 'notice', 'contacts', 'seo', 'media', 'sections', 'stats', 'programs', 'gallery', 'testimonials', 'news'].includes(lastPart) 
    ? lastPart 
    : 'hero';

  const setActiveTab = (tabId: string) => {
    navigate(`/front-cms/${tabId}`);
  };

  const tabs = [
    { id: 'hero', name: 'Hero Section', icon: ImageIcon },
    { id: 'notice', name: 'Announcement Bar', icon: Megaphone },
    { id: 'contacts', name: 'Inquiries', icon: MessageSquare },
    { id: 'seo', name: 'SEO & Social', icon: Globe },
    { id: 'media', name: 'Media Library', icon: Folder },
    { id: 'sections', name: 'About & Heritage', icon: Type },
    { id: 'stats', name: 'Statistics', icon: BarChart3 },
    { id: 'programs', name: 'Academic Programs', icon: BookOpen },
    { id: 'gallery', name: 'Gallery', icon: Grid },
    { id: 'testimonials', name: 'Testimonials', icon: MessageSquare },
    { id: 'news', name: 'News & Events', icon: Newspaper },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Front CMS Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Control the content of your public website landing pages.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800/50 p-6 min-h-[600px]">
        {activeTab === 'hero' && <HeroManager />}
        {activeTab === 'notice' && <NoticeManager />}
        {activeTab === 'contacts' && <ContactManager />}
        {activeTab === 'seo' && <SeoManager />}
        {activeTab === 'media' && <MediaLibrary />}
        {activeTab === 'sections' && <SectionManager />}
        {activeTab === 'stats' && <StatManager />}
        {activeTab === 'programs' && <ProgramManager />}
        {activeTab === 'gallery' && <GalleryManager />}
        {activeTab === 'testimonials' && <TestimonialManager />}
        {activeTab === 'news' && <NewsManager />}
      </div>
    </div>
  );
};

export default FrontCmsDashboard;
