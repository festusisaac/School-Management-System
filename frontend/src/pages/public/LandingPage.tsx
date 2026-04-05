import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { 
  MapPin,
  Clock,
  ArrowRight,
  Award,
  Users,
  Globe,
  Heart,
  Star,
  Quote,
  ChevronRight,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';
import image16 from '@assets/herobg/image16.jpeg';
import image17 from '@assets/herobg/image17.jpeg';
import image18 from '@assets/herobg/image18.jpeg';
import image20 from '@assets/herobg/image20.jpeg';
import image24 from '@assets/herobg/image24.jpeg';
import image43 from '@assets/herobg/image43.jpeg';
import aboutImg from '@assets/About.jpeg';
import catherineImg from '@assets/Catherine-Kasper.jpg';
import nurseryImg from '@assets/phjcschool/image4.jpeg';
import primaryImg from '@assets/phjcschool/image11.jpeg';
import secondaryImg from '@assets/phjcschool/image27.jpeg';

// Gallery Assets - Campus
import campus1 from '@assets/phjcschool/image95.jpeg';
import campus2 from '@assets/phjcschool/image6.jpeg';
import campus3 from '@assets/phjcschool/image29.jpeg';

// Gallery Assets - Spirituality
import faith1 from '@assets/phjcschool/image58.jpeg';
import faith2 from '@assets/phjcschool/image79.jpeg';
import faith3 from '@assets/phjcschool/image59.jpeg';

// Gallery Assets - Activities
import activity1 from '@assets/phjcschool/image2.jpeg';
import activity2 from '@assets/phjcschool/image33.jpeg';
import activity3 from '@assets/phjcschool/image31.jpeg';

// News & Announcement Assets
import news1 from '@assets/phjcschool/image80.jpeg';
import news2 from '@assets/phjcschool/image84.jpeg';
import news3 from '@assets/phjcschool/image88.jpeg';

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LandingPage = () => {
  const heroImages = [image16, image17, image18, image20, image24, image43];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState('campus');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "The transformation in my son's discipline and academic performance since joining PHJC is remarkable. The teachers truly care about every child's individual growth.",
      author: "Mrs. Florence Adebayor",
      role: "Parent of Nursery 2 Student",
      rating: 5
    },
    {
      quote: "As a parent, I value the spiritual foundation PHJC provides. It's not just about academic excellence; it's about building strong moral character in our children.",
      author: "Chief Emeka Okoro",
      role: "Parent of Primary 5 Student",
      rating: 5
    },
    {
      quote: "The facility is top-notch, especially the science and computer labs. My daughter is already showing great interest in STEM thanks to the school's hands-on approach.",
      author: "Mrs. Sarah Williams",
      role: "Parent of S.S. 2 Student",
      rating: 5
    }
  ];

  const galleryData = {
    campus: [
      { img: campus1, title: 'Modern Classrooms', category: 'The Campus' },
      { img: campus2, title: 'Computer Laboratory', category: 'The Campus' },
      { img: campus3, title: 'School Library', category: 'The Campus' },
    ],
    spirituality: [
      { img: faith1, title: 'Morning Prayer', category: 'Spirituality' },
      { img: faith2, title: 'Catholic Heritage', category: 'Spirituality' },
      { img: faith3, title: 'Community Service', category: 'Spirituality' },
    ],
    activities: [
      { img: activity1, title: 'JET Club Projects', category: 'Activities' },
      { img: activity2, title: 'Inter-House Sports', category: 'Activities' },
      { img: activity3, title: 'Cultural Day Celebrations', category: 'Activities' },
    ]
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const { settings } = useSystem();
  const schoolName = settings?.schoolName || 'YOUR SCHOOL';

  return (
    <>

      <section className="relative h-screen w-full overflow-hidden flex items-center">
        {/* Carousel Background */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out transform ${
                index === currentSlide 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-110'
              }`}
            >
              <img 
                src={img} 
                alt={`Slide ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-slate-900/40 z-10"></div>
          <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay z-10"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-10">
          <div className="max-w-3xl space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-600/30 backdrop-blur-md rounded-full border border-white/20">
              <Award size={14} className="text-primary-300" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest shadow-sm">Excellence in Education</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-white leading-[1.1] drop-shadow-xl">
              Nurturing <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-300">Leaders</span> <br /> of Tomorrow
            </h1>
            
            <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-xl drop-shadow-md font-medium">
              Welcome to {schoolName}, where we combine academic rigor with moral guidance to inspire students toward a life of service and honor.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/admission"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-full font-bold text-base transition-all shadow-xl hover:shadow-primary-500/40 flex items-center justify-center gap-2 active:scale-95"
              >
                Apply now <ArrowRight size={20} />
              </Link>
              <a
                href="#about"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-3.5 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

      </section>

      <ScrollReveal>
        <section className="relative z-20 -mt-12 md:-mt-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
              <div className="text-center md:text-left space-y-0.5">
                <div className="text-2xl lg:text-3xl font-black font-heading text-primary-600 tracking-tight">500+</div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global Alumnae</div>
              </div>
              <div className="hidden md:block h-10 w-px bg-slate-100"></div>
              <div className="text-center md:text-left space-y-0.5">
                <div className="text-2xl lg:text-3xl font-black font-heading text-primary-600 tracking-tight">300+</div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Student Enrolled</div>
              </div>
              <div className="hidden md:block h-10 w-px bg-slate-100"></div>
              <div className="text-center md:text-left space-y-0.5">
                <div className="text-2xl lg:text-3xl font-black font-heading text-primary-600 tracking-tight">30+</div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Academic Programs</div>
              </div>
              <div className="hidden md:block h-10 w-px bg-slate-100"></div>
              <div className="text-center md:text-left space-y-0.5">
                <div className="text-2xl lg:text-3xl font-black font-heading text-primary-600 tracking-tight">100%</div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">University Placement</div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* About Us Section - Minimalist Redesign */}
      <ScrollReveal>
        <section id="about" className="py-24 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-start">
              {/* Text Content - Left Hand */}
              <div className="lg:w-3/5 space-y-10">
                <div className="space-y-4">
                  <h2 className="text-primary-600 font-bold text-xs uppercase tracking-widest">Our Story & Mission</h2>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-slate-900 leading-tight">
                    Providing Accessible & <br /> Meaningful Education
                  </h3>
                </div>
                
                <div className="space-y-8 text-lg text-slate-600 leading-relaxed font-normal">
                  <p>
                    PHJC Nursery, Primary, and Secondary School Azhin Kasa was established to provide accessible, high-quality education to children in rural communities. Managed by the <span className="text-primary-600 font-bold border-b-2 border-primary-100 uppercase tracking-tighter text-sm">Poor Handmaids of Jesus Christ</span>, we are committed to ensuring that no child is left behind due to financial or social barriers.
                  </p>
                  
                  <p>
                    Our institution goes beyond academics to emphasize character development, discipline, and spiritual growth. We view education as a powerful tool for transformation, guiding students in values of integrity, respect, and service to build a better future for themselves and their community.
                  </p>
                </div>

              </div>

              {/* Picture Content - Right Hand */}
              <div className="lg:w-2/5 w-full">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-slate-100 rounded-[2rem] group-hover:bg-primary-50 transition-colors duration-500"></div>
                  <img 
                    src={aboutImg} 
                    alt="PHJC School Campus" 
                    className="relative rounded-[1.5rem] w-full aspect-[4/5] object-cover shadow-sm grayscale hover:grayscale-0 transition-all duration-1000" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
      {/* Spirit & Heritage Section */}
      <ScrollReveal>
        <section id="heritage" className="py-16 md:py-20 bg-slate-50 dark:bg-slate-900/40 overflow-hidden transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col-reverse lg:flex-row gap-16 items-center mb-24">
              {/* Left Hand: Picture Content (Saint Katharina) */}
              <div className="lg:w-2/5 w-full">
                <div className="relative group">
                  <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary-100 dark:bg-primary-900/20 rounded-[2rem] -z-10 animate-pulse"></div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary-100 dark:bg-secondary-900/20 rounded-[2rem] -z-10 animate-pulse-slow"></div>
                  
                  <img 
                    src={catherineImg} 
                    alt="Saint Katharina Kasper" 
                    className="relative rounded-[2rem] w-full aspect-[3/4] object-cover shadow-2xl z-10 grayscale hover:grayscale-0 transition-all duration-1000 border-4 border-white dark:border-slate-800" 
                  />
                </div>
              </div>

              {/* Right Hand: Story & Heritage */}
              <div className="lg:w-3/5 space-y-10 animate-fade-in">
                <div className="space-y-4 text-center lg:text-left">
                  <h2 className="text-primary-600 font-bold text-xs uppercase tracking-widest">The PHJC Heritage</h2>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                    The Vision of <br /> Saint Katharina Kasper
                  </h3>
                </div>
                
                <div className="space-y-8 text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  <p>
                    Our school's journey is deeply rooted in the vision of <span className="text-primary-600 font-bold italic">Saint Katharina Kasper</span>. Unlike secular institutions, our foundation is built on a spiritual mission to serve.
                  </p>
                  
                  <p>
                    The Poor Handmaids of Jesus Christ (PHJC) started this school in Azhin Kasa with a clear purpose: to bring high-quality, value-based education to a rural community that was previously underserved. This was not just a project—it was a call to serve the children who would otherwise have been left behind.
                  </p>

                  <p className="italic text-slate-500 font-medium text-center lg:text-left">
                    "We have more to do with the people than with the walls, of this be always mindful." — St. Katharina Kasper
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Academic Programs Section */}
      <section id="academics" className="py-16 md:py-20 bg-slate-50 dark:bg-transparent transition-colors duration-500">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/20 mb-6">
              <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest">Our Levels</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">
              Academic <span className="text-primary-600">Programs</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Providing a continuous path of excellence from early childhood to college readiness.
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8 md:gap-12 pb-12">
          {/* Nursery Stage */}
          <ScrollReveal delay={200}>
            <div className="group bg-white dark:bg-slate-900/50 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover-lift h-full">
              <div className="relative h-48 mb-8 overflow-hidden rounded-2xl">
                <img src={nurseryImg} alt="Nursery Program" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4">
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest">Nursery</div>
                </div>
              </div>
              <h4 className="text-xl font-heading font-bold mb-4 text-slate-900 dark:text-white">Early Foundation</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm mb-6">
                Our play-based curriculum focuses on cognitive development, early literacy, and social coordination through creative exploration.
              </p>
            </div>
          </ScrollReveal>

          {/* Primary Stage */}
          <ScrollReveal delay={400}>
            <div className="group bg-white dark:bg-slate-900/50 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover-lift h-full">
              <div className="relative h-48 mb-8 overflow-hidden rounded-2xl">
                <img src={primaryImg} alt="Primary Program" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4">
                  <div className="bg-primary-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white">Primary</div>
                </div>
              </div>
              <h4 className="text-xl font-heading font-bold mb-4 text-slate-900 dark:text-white">Formative Excellence</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm mb-6">
                Building a strong academic core and ethical leadership through a structured curriculum focused on English, Mathematics, and Moral guidance.
              </p>
            </div>
          </ScrollReveal>

          {/* Secondary Stage */}
          <ScrollReveal delay={600}>
            <div className="group bg-white dark:bg-slate-900/50 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover-lift h-full">
              <div className="relative h-48 mb-8 overflow-hidden rounded-2xl">
                <img src={secondaryImg} alt="Secondary Program" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4">
                  <div className="bg-secondary-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white">Secondary</div>
                </div>
              </div>
              <h4 className="text-xl font-heading font-bold mb-4 text-slate-900 dark:text-white">Future Leaders</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm mb-6">
                Preparing students for national WAEC/NECO examinations with a rigorous academic program that encourages critical thinking and career readiness.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* School Life Gallery Section */}
      <ScrollReveal>
        <section id="gallery" className="py-24 md:py-32 bg-white dark:bg-transparent transition-colors duration-500 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Our Environment</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight mb-8">
              Life at <span className="text-primary-600">PHJC School</span>
            </h2>
            
            {/* Gallery Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-16">
              {[
                { id: 'campus', name: 'The Campus', icon: Globe },
                { id: 'spirituality', name: 'Spirituality', icon: Heart },
                { id: 'activities', name: 'Extra-Curriculars', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGalleryTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 border-2 ${
                    activeGalleryTab === tab.id
                      ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/20'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-primary-500/30 hover:text-primary-600'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid md:grid-cols-3 gap-8 md:gap-10">
              {galleryData[activeGalleryTab as keyof typeof galleryData].map((item, index) => (
                <div 
                  key={`${activeGalleryTab}-${index}`} 
                  className="group relative h-96 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 animate-fade-in"
                >
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  {/* Minimal Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <div className="flex flex-col items-start translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1">
                        {item.category}
                      </span>
                      <h5 className="text-xl font-bold text-white leading-tight">
                        {item.title}
                      </h5>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* News & Announcement Section */}
      <ScrollReveal>
        <section id="news" className="py-24 md:py-32 bg-slate-50 dark:bg-slate-900/40 transition-colors duration-500 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-16">
              <div className="space-y-4 max-w-xl text-center md:text-left">
                <h2 className="text-primary-600 font-bold text-xs uppercase tracking-widest">Updates & Events</h2>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                  News & <span className="text-primary-600">Announcements</span>
                </h3>
              </div>
              <Link 
                to="/news" 
                className="hidden md:flex items-center gap-2 text-primary-600 font-bold text-sm hover:gap-3 transition-all group"
              >
                View All News <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-16">
              {[
                {
                  img: news1,
                  tag: 'Sports',
                  date: 'March 24, 2026',
                  title: 'Annual Inter-House Sports Highlights',
                  slug: 'annual-inter-house-sports-2026',
                  snippet: 'Relive the excitement of our students\' sportsmanship and team spirit during this year\'s athletic competition.'
                },
                {
                  img: news2,
                  tag: 'Academic',
                  date: 'March 15, 2026',
                  title: '100% Success Rate in WAEC 2025',
                  slug: 'waec-results-success-2025',
                  snippet: 'Celebrating our senior students\' remarkable academic achievement and a flawless pass rate in national exams.'
                },
                {
                  img: news3,
                  tag: 'Notice',
                  date: 'April 02, 2026',
                  title: '2nd Term Resumption Notice',
                  slug: 'second-term-resumption-notice',
                  snippet: 'Important dates and preparations for the upcoming academic session. We look forward to welcoming our students.'
                }
              ].map((news, index) => (
                <div key={index} className="group bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-slate-700/50 flex flex-col h-full">
                  <div className="relative h-56 mb-6 overflow-hidden rounded-2xl">
                    <img 
                      src={news.img} 
                      alt={news.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white">{news.tag}</span>
                    </div>
                  </div>
                  <div className="space-y-4 px-2 flex flex-col flex-grow">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{news.date}</div>
                    <h4 className="text-xl font-heading font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">{news.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 flex-grow">{news.snippet}</p>
                    <Link to={`/news/${news.slug}`} className="pt-4 text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                      Read More <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View All Button */}
            <div className="md:hidden flex justify-center">
              <Link 
                to="/news" 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-8 py-3.5 rounded-full font-bold text-primary-600 shadow-sm flex items-center gap-2"
              >
                View All News <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Parent Testimonials Section */}
      <ScrollReveal>
        <section id="testimonials" className="py-24 md:py-32 bg-white dark:bg-transparent overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-primary-600 font-bold text-xs uppercase tracking-widest text-center">Community Stories</h2>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                What Our <span className="text-primary-600">Parents</span> Say
              </h3>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Carousel Container */}
              <div className="relative h-[400px] md:h-[350px] flex items-center justify-center">
                {testimonials.map((t, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out flex flex-col items-center justify-center text-center space-y-8 ${
                      index === currentTestimonial 
                        ? 'opacity-100 translate-x-0 scale-100' 
                        : 'opacity-0 translate-x-12 scale-95 pointer-events-none'
                    }`}
                  >
                    <div className="relative">
                      <Quote className="text-primary-100 dark:text-primary-900 absolute -top-8 -left-10 w-20 h-20 -z-10 opacity-50" />
                      <p className="text-xl md:text-2xl lg:text-3xl font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic px-4">
                        "{t.quote}"
                      </p>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <div className="flex justify-center gap-1 text-secondary-500">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" />
                        ))}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t.author}</h4>
                        <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-center gap-3 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-2 transition-all duration-500 rounded-full ${
                      index === currentTestimonial 
                        ? 'w-8 bg-primary-600' 
                        : 'w-2 bg-slate-200 dark:bg-slate-800 hover:bg-primary-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Contact Section */}
      <ScrollReveal>
        <section id="contact" className="py-24 md:py-32 bg-slate-50 dark:bg-slate-900/40 transition-colors duration-500 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Left Column: Form UI */}
              <div className="space-y-10 group">
                <div className="space-y-4">
                  <h2 className="text-primary-600 font-bold text-xs uppercase tracking-widest">Connect With Us</h2>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                    Questions? <br /> <span className="text-primary-600">Get In Touch</span>
                  </h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md">
                    Our administration is here to help you with admissions, information, or any inquiries you may have.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-2">Full Name</label>
                      <input type="text" placeholder="John Doe" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-2">Email Address</label>
                      <input type="email" placeholder="john@example.com" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-medium" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-2">Message</label>
                    <textarea placeholder="How can we help you?" rows={4} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-medium resize-none"></textarea>
                  </div>
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                    Send Message <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              {/* Right Column: Contact Cards */}
              <div className="lg:pt-10 space-y-12">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Address Card */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover-lift space-y-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
                      <MapPin size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white">Our Campus</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {settings?.schoolAddress || 'Azhin Kasa, Nigeria'}
                      </p>
                    </div>
                  </div>

                  {/* Contact Card */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover-lift space-y-4">
                    <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center text-secondary-600">
                      <Phone size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white">Phone & Email</h4>
                      <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                        <p>{settings?.schoolPhone || '+234 800 000 0000'}</p>
                        <p className="truncate">{settings?.schoolEmail || 'info@phjcschool.edu.ng'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hours Card */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover-lift space-y-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Clock size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white">Office Hours</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mon - Fri: 8:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>

                  {/* Social Support */}
                  <div className="bg-primary-600 p-8 rounded-[2rem] shadow-xl shadow-primary-500/20 space-y-4">
                    <h4 className="font-heading font-bold text-white">Social Media</h4>
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
                          className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-primary-600 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm"
                        >
                          <social.icon size={18} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA Section */}
      <ScrollReveal>
        <section id="admissions" className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-slate-900 rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative space-y-8 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-heading font-black text-white leading-tight">
                  Ready to Join Our Community?
                </h2>
                <p className="text-slate-400 text-lg md:text-xl">
                  Admissions are now open for the next academic session. Secure your child's future today in an environment that values potential above all else.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/admission"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-xl shadow-primary-500/20"
                  >
                    Start Your Application
                  </Link>
                  <Link
                    to="/contact"
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold text-base transition-all"
                  >
                    Schedule a Visit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

    </>
  );
};

export default LandingPage;
