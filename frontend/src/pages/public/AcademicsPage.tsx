import { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  BookOpen,
  Award,
  Lightbulb,
  GraduationCap,
  Users,
  ShieldCheck,
  Microscope,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

import cmsService, { CmsPublicInit } from '../../services/cms.service';
import LoadingScreen from '../../components/common/LoadingScreen';

// Assets from LandingPage
import nurseryImg from '@assets/phjcschool/image4.jpeg';
import primaryImg from '@assets/phjcschool/image11.jpeg';
import secondaryImg from '@assets/phjcschool/image27.jpeg';

const AcademicsPage = () => {
  const { settings, getFullUrl } = useSystem();
  const [cmsData, setCmsData] = useState<CmsPublicInit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await cmsService.getPublicInit();
        setCmsData(data);
      } catch (error) {
        console.error('Failed to fetch academics data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, []);

  const schoolName = settings?.schoolName || 'PHJC School';

  // Logic to build dynamic levels from CMS programs, or use fallbacks
  const getLevels = () => {
    const cmsPrograms = cmsData?.programs || [];

    if (cmsPrograms.length > 0) {
      return cmsPrograms.map(prog => ({
        title: prog.title,
        desc: prog.description,
        image: prog.imageUrl?.startsWith('blob:') ? prog.imageUrl : getFullUrl(prog.imageUrl),
        features: prog.level === 'Nursery' ? ['Montessori-inspired Methods', 'Sensory Development', 'Social Integration', 'Early Literacy'] :
          prog.level === 'Primary' ? ['Advanced Numeracy', 'Critical Literacy', 'Moral Instruction', 'Creative Arts'] :
            ['STEM Focus', 'National Exam Prep', 'Leadership Training', 'Career Guidance']
      }));
    }

    // Fallback static structure
    return [
      {
        title: 'Early Foundation (Nursery)',
        desc: 'Our nursery program focuses on the holistic development of the child through play-based learning and sensory exploration. We emphasize social coordination, early literacy, and creative expression in a nurturing environment.',
        image: nurseryImg,
        features: ['Montessori-inspired Methods', 'Sensory Development', 'Social Integration', 'Early Literacy']
      },
      {
        title: 'Formative Excellence (Primary)',
        desc: 'The primary years are dedicated to building a rock-solid foundation in core academic subjects while fostering moral integrity. Our curriculum balances rigorous study with extra-curricular activities to develop well-rounded individuals.',
        image: primaryImg,
        features: ['Advanced Numeracy', 'Critical Literacy', 'Moral Instruction', 'Creative Arts']
      },
      {
        title: 'Future Ready (Secondary)',
        desc: 'Preparing students for the challenges of higher education and beyond. Our secondary program focuses on critical thinking, scientific inquiry, and leadership, ensuring 100% readiness for WAEC/NECO examinations.',
        image: secondaryImg,
        features: ['STEM Focus', 'National Exam Prep', 'Leadership Training', 'Career Guidance']
      }
    ];
  };

  const levels = getLevels();

  if (loading) {
    return <LoadingScreen message="Loading Academic Programs..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
      {/* Hero Section - Restored Premium Design */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/50 -z-10"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/20">
              <GraduationCap className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">Academic Excellence</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              Nurturing Minds, <br />
              <span className="text-primary-600">Inspiring Service.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
              At {schoolName}, we provide a comprehensive educational journey that combines academic rigor with spiritual and moral development to prepare leaders for a global community.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section - Restored Premium Design */}
      <section className="py-20 border-y border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Inclusive Curriculum</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">A blend of national standards and international best practices tailored for every learner.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Moral Foundation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Spiritual growth is at our core, ensuring students develop strong character alongside grades.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Modern Facilities</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">High-tech labs and expansive library resources to support scientific and literary inquiry.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Levels - Restored Premium Design */}
      <section className="py-24 space-y-32">
        {levels.map((level, idx) => (
          <div key={idx} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-center`}>
              <div className="lg:w-1/2 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">{level.title}</h2>
                  <div className="h-1.5 w-20 bg-primary-600 rounded-full"></div>
                </div>
                <div
                  className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium prose prose-lg dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: level.desc }}
                />
                <div className="grid grid-cols-2 gap-4">
                  {level.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 group">
                      <CheckCircle2 className="w-5 h-5 text-primary-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors uppercase tracking-wider leading-none">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2 w-full">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-slate-100 dark:bg-slate-900 rounded-[3rem] -z-10 transition-transform duration-500 group-hover:scale-105"></div>
                  <img
                    src={level.image}
                    alt={level.title}
                    className="rounded-[2.5rem] w-full aspect-[4/3] object-cover shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-black/10"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Curriculum Standards - Restored Premium Design */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2 space-y-10">
              <div className="space-y-4">
                <h2 className="text-primary-400 font-bold text-xs uppercase tracking-widest leading-none">Our Standards</h2>
                <h3 className="text-4xl md:text-5xl font-heading font-black text-white leading-tight">National Examination & Global Standards</h3>
              </div>

              <div className="space-y-6">
                {[
                  { icon: Microscope, title: 'STEM Centric Learning', text: 'Integrated science, technology, engineering, and math modules to spark innovation.' },
                  { icon: Award, title: '100% Exam Success', text: 'Consistent track record of excellence in WAEC and NECO examinations year after year.' },
                  { icon: Users, title: 'Personalized Mentorship', text: 'Low student-teacher ratio ensuring every learner receives necessary academic attention.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                    <div className="shrink-0 w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1 leading-none">{item.title}</h4>
                      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 md:p-16 space-y-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>
              <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary-500/30 group-hover:scale-110 transition-transform duration-500">
                <Award size={40} />
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">Award Winning Pedagogy</h4>
                <p className="text-slate-400 text-lg leading-relaxed">Recognized as one of the leading innovative institutions in the region for academic resilience and community transformation.</p>
              </div>
              <div className="pt-6">
                <a
                  href="/admission"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-base hover:bg-primary-50 transition-all active:scale-95 shadow-xl shadow-white/10"
                >
                  Join Our Institution <ArrowRight size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AcademicsPage;
