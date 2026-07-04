import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { motion, useMotionValue, useSpring, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Shield, MessageSquare, Globe, Cpu, 
  ArrowRight, Users, Layout, Briefcase, 
  ChevronRight, ArrowUpRight, Menu, X 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yForward = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const yBackward = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const blurValue = useTransform(scrollYProgress, [0, 0.5], ["blur(0px)", "blur(10px)"]);
  const opacityValue = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scaleValue = useTransform(scrollYProgress, [0, 0.5], [1, 1.3]);

  // Initialize Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    lenis.scrollTo(0, { immediate: true });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { damping: 30, stiffness: 150 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 150 });

  const [isMobile, setIsMobile] = React.useState(false);
  const [isNavOpen, setIsNavOpen] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e) => {
      if (!isMobile) {
        mouseX.set(e.clientX - 400);
        mouseY.set(e.clientY - 400);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobile]);

  const ecosystem = [
    {
      title: 'Student App',
      description: 'Report grievances, track status, and chat with Nexa Chatbot.',
      icon: <Users className="text-[#FB3640]" />,
      link: '/student',
      tag: 'MOBILE APP'
    },
    {
      title: 'Staff App',
      description: 'The companion mobile app for staff, designed to manage grievances, track progress in real time, and ensure timely resolutions.',
      icon: <Briefcase className="text-[#FB3640]" />,
      link: '/staff',
      tag: 'MOBILE APP'
    },
    {
      title: 'Admin Panel',
      description: 'Real-time analytics and centralized control for university management.',
      icon: <Layout className="text-[#FB3640]" />,
      link: '/admin',
      tag: 'DASHBOARD'
    }
  ];

  const features = [
    { title: 'Fast Resolution', icon: <Cpu size={20} /> },
    { title: 'Secure & Private', icon: <Shield size={20} /> },
    { title: 'Always Transparent', icon: <Globe size={20} /> },
    { title: 'Easy Access', icon: <MessageSquare size={20} /> }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#000000] text-[#FFF3E6] font-['Outfit',sans-serif] overflow-x-hidden selection:bg-[#FB3640]/30 relative">
      {/* Smooth Solid Background - No texture, No glow */}
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 z-10 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] bg-[radial-gradient(circle,rgba(251,54,64,0.08)_0%,rgba(0,0,0,0)_70%)] blur-[100px]"
          />
        </div>

        <div className="max-w-7xl mx-auto w-full text-center relative z-20">
          <div className="flex flex-col items-center">
            <div className="mb-12">
              <h1 className="text-[18vw] md:text-[15rem] font-black leading-[0.8] tracking-[0.1em] md:tracking-[0.2em] uppercase text-[#FB3640] flex flex-wrap justify-center overflow-hidden">
                {"GIET".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: "120%", skewY: 10, filter: "blur(20px)", opacity: 0 }}
                    animate={{ y: 0, skewY: 0, filter: "blur(0px)", opacity: 1 }}
                    transition={{ 
                      duration: 1.8, 
                      delay: i * 0.1,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    style={{ y: yForward, filter: blurValue, opacity: opacityValue, scale: scaleValue }}
                    className="inline-block origin-bottom"
                  >
                    {char}
                  </motion.span>
                ))}
              </h1>
            </div>
            
            <div className="mb-12">
              <h2 className="text-xl md:text-6xl font-black tracking-[0.1em] leading-[0.9] text-[#FFF3E6] flex flex-wrap justify-center gap-x-4 overflow-hidden">
                {"Grievance Redressal System".split(" ").map((word, i) => (
                  <div key={i} className="flex overflow-hidden">
                    {word.split("").map((char, j) => (
                      <motion.span
                        key={j}
                        initial={{ y: "150%", skewY: 15, filter: "blur(15px)", opacity: 0 }}
                        animate={{ y: 0, skewY: 0, filter: "blur(0px)", opacity: 1 }}
                        transition={{ 
                          duration: 1.5, 
                          delay: 0.5 + (i * 0.1) + (j * 0.03),
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        style={{ y: yBackward, filter: blurValue, opacity: opacityValue, scale: scaleValue }}
                        className="inline-block origin-bottom"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                ))}
              </h2>
            </div>

          </div>
        </div>
      </section>

      {/* ECOSYSTEM SECTION */}
      <section id="ecosystem" className="relative py-48 px-6 z-10 bg-[#000000]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-32 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FB3640] mb-6 block">Digital Universe</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-8">Unified <span className="text-[#FB3640]/80">Ecosystem</span></h2>
            <div className="w-8 h-px bg-[#FFF3E6]/10 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {ecosystem.map((p, i) => (
              <Link 
                key={i}
                to={p.link}
                className="group relative p-10 rounded-[2.5rem] border border-[#FB3640]/20 shadow-[0_0_30px_rgba(251,54,64,0.1)] hover:border-[#FB3640]/60 transition-all duration-500 bg-[#000000] hover:shadow-[0_0_50px_rgba(251,54,64,0.25)] cursor-pointer block"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FB3640] mb-6 block opacity-60 group-hover:opacity-100 transition-opacity">
                  {p.tag}
                </span>
                <h3 className="text-2xl font-black mb-6 uppercase tracking-widest">{p.title}</h3>
                <p className="text-[#FFF3E6]/40 text-sm leading-relaxed mb-10 font-medium tracking-wide group-hover:text-[#FFF3E6]/60 transition-colors">
                  {p.description}
                </p>
                <div className="inline-flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-[#FB3640]/40 group-hover:text-[#FB3640] group-hover:gap-5 transition-all">
                  Launch <ArrowUpRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* MENTORS SECTION */}
      {(() => {
        const mentors = [
          {
            id: 0,
            name: "Dr. Jibanananda Jena",
            role: "Principal",
            image: "/principal.jpg",
            quote: "This initiative reflects a strong commitment towards improving student welfare and institutional transparency. A structured grievance system like this empowers students, strengthens trust, and ensures every voice is heard. It is not just a portal, but a digital bridge that fosters a culture of accountability and continuous improvement across our campus. We are proud of the technical excellence and vision shown here."
          },
          {
            id: 1,
            name: "Prof. Sidhanta Ku. Balabantaray",
            role: "Head of Department",
            image: "/hod.jpeg",
            quote: "The project demonstrates practical problem-solving and real-world impact at its finest. By digitizing the grievance workflow, it simplifies communication between students and administration, making handling more efficient and accountable. This system provides actionable insights through data, allowing us to address root causes rather than just symptoms. It's a significant leap forward in our departmental digital strategy."
          },
          {
            id: 2,
            name: "Prof. Smarak Ku. Nayak",
            role: "Project Guide",
            image: "/guide.jpeg",
            quote: "This system showcases excellent technical implementation combined with a meaningful social purpose. The students have built a scalable, secure, and user-friendly solution addressing real challenges within the campus ecosystem. From its intuitive UI to the robust backend architecture, the project reflects a high level of engineering maturity. It serves as a benchmark for how student-led initiatives can solve complex institutional problems."
          }
        ];
        const [hoveredId, setHoveredId] = React.useState(null);
        const [lastHoveredId, setLastHoveredId] = React.useState(null);

        const handleHover = (id) => {
          if (id === null) {
            setLastHoveredId(hoveredId);
            setHoveredId(null);
            setTimeout(() => setLastHoveredId(null), 1200);
          } else {
            setHoveredId(id);
            setLastHoveredId(null);
          }
        };

        return (
          <section id="mentors" className="relative py-48 px-6 z-10 bg-[#000000]">
            <div className="max-w-6xl mx-auto">
              <div className="mb-32 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FB3640] mb-6 block">Visionary Support</span>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-8">What Our <span className="text-[#FB3640]/80">Mentors Say</span></h2>
                <div className="w-8 h-px bg-[#FFF3E6]/10 mx-auto" />
              </div>

              {/* Cards Container */}
              <div className="hidden md:grid md:grid-cols-3 gap-8 h-[420px] relative">
                {mentors.map((m, i) => {
                  const isActive = hoveredId === m.id;
                  const isOther = hoveredId !== null && hoveredId !== m.id;
                  const wasActive = lastHoveredId === m.id;

                  return (
                    <div
                      key={m.id}
                      className="relative"
                      onMouseEnter={() => handleHover(m.id)}
                      onMouseLeave={() => handleHover(null)}
                    >
                      <motion.div
                        animate={{
                          opacity: isOther ? 0 : 1,
                          scale: isOther ? 0.97 : 1,
                        }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className={`absolute inset-0 rounded-[2.5rem] border bg-[#0D0D0D] overflow-hidden cursor-pointer
                          ${isActive ? 'border-[#FB3640]/30' : 'border-[#FB3640]/10'}`}
                        style={{
                          width: isActive ? `calc(300% + 2 * 2rem)` : '100%',
                          left: isActive
                            ? i === 0 ? '0'
                            : i === 1 ? `calc(-100% - 2rem)`
                            : `calc(-200% - 4rem)`
                            : '0',
                          transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1), left 1.2s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease, border-color 0.4s ease, scale 0.5s ease',
                          zIndex: isActive ? 50 : (wasActive ? 40 : 10),
                        }}
                      >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FB3640]/40 to-transparent" />

                        <div className={`p-10 h-full flex ${isActive ? 'flex-row items-center gap-12' : 'flex-col items-center justify-start'}`}>
                          {/* Profile */}
                          <div
                            className={`flex-shrink-0 ${isActive ? 'flex flex-col items-center text-center' : 'flex flex-row items-center gap-6 w-full'}`}
                            style={{ transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)' }}
                          >
                            <div
                              className="rounded-full bg-[#FB3640]/10 border border-[#FB3640]/20 overflow-hidden relative flex-shrink-0 flex items-center justify-center"
                              style={{
                                width: isActive ? '120px' : '64px',
                                height: isActive ? '120px' : '64px',
                                marginBottom: isActive ? '1rem' : '0',
                                transition: 'all 1.2s cubic-bezier(0.22,1,0.36,1)',
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-[#FB3640]/20 to-transparent" />
                              {m.image ? (
                                <img 
                                  src={m.image} 
                                  alt={m.name} 
                                  className={`absolute inset-0 w-full h-full object-cover relative z-10 ${m.role === "Project Guide" ? "scale-110" : ""}`}
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              ) : (
                                <Users size={isActive ? 48 : 28} className="text-[#FB3640]/50 relative z-10" style={{ transition: 'all 0.6s ease' }} />
                              )}
                            </div>
                            <div className={isActive ? 'text-center' : 'text-left'}>
                              <h4 className="font-black text-[#FFF3E6] tracking-tight leading-tight text-[1.2rem]">{m.name}</h4>
                              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FB3640]/60 mt-1 block">{m.role}</span>
                            </div>
                          </div>

                          {/* Divider */}
                          {!isActive && <div className="w-full h-px bg-[#FB3640]/10 my-8 flex-shrink-0" />}

                          {/* Quote */}
                          <div
                            className="flex-1 flex items-start overflow-hidden"
                            style={{
                              transition: 'opacity 0.5s ease 0.3s',
                              opacity: 1,
                            }}
                          >
                            <p
                              style={{
                                fontSize: '1.05rem',
                                WebkitLineClamp: isActive ? 'unset' : 6,
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.7',
                              }}
                              className="text-[#FFF3E6]/60 font-medium italic"
                            >
                              "{m.quote}"
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile — simple vertical stack */}
              <div className="flex flex-col gap-8 md:hidden">
                {mentors.map((m) => (
                  <div key={m.id} className="rounded-[2rem] border border-[#FB3640]/10 bg-[#0D0D0D] p-8">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 rounded-full bg-[#FB3640]/10 border border-[#FB3640]/20 flex items-center justify-center flex-shrink-0">
                        <Users size={28} className="text-[#FB3640]/50" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#FFF3E6]">{m.name}</h4>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FB3640]/60">{m.role}</span>
                      </div>
                    </div>
                    <p className="text-[#FFF3E6]/50 text-base leading-relaxed font-medium italic">"{m.quote}"</p>
                  </div>
                ))}
              </div>

            </div>
          </section>
        );
      })()}


      {/* TEAM NEXUS SECTION */}
      <section id="team" className="relative py-64 px-6 z-10 bg-[#000000] overflow-hidden">
        {/* Intense Concentrated Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FB3640]/[0.05] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FB3640]/[0.08] rounded-full blur-[100px] animate-pulse pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative inline-block"
          >
            {/* External Halo Glow */}
            <div className="absolute -inset-8 bg-[#FB3640]/5 rounded-[5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <Link to="/team" className="group relative inline-block p-16 md:p-24 rounded-[4rem] bg-[#000000] border border-[#FB3640]/20 hover:border-[#FB3640]/60 transition-all duration-700 overflow-hidden shadow-[0_0_50px_rgba(251,54,64,0.05)] hover:shadow-[0_0_80px_rgba(251,54,64,0.15)]">
              {/* Animated Border Gradient Layer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FB3640]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              
              <h2 className="text-6xl md:text-9xl font-black uppercase tracking-[0.4em] mb-12 text-[#FB3640]/80 leading-none group-hover:text-[#FB3640] transition-all duration-700 group-hover:tracking-[0.5em] drop-shadow-[0_0_30px_rgba(251,54,64,0.2)]">
                TEAM<br/>NEXUS
              </h2>
              <div className="h-px w-16 bg-[#FB3640]/30 mx-auto mb-12 group-hover:w-48 transition-all duration-700" />
              <p className="text-xs md:text-sm font-black uppercase tracking-[0.7em] text-[#FFF3E6]/40 group-hover:text-[#FFF3E6]/80 transition-colors duration-700">
                The Architects of Excellence
              </p>

              {/* Decorative Corner Brackets */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-[#FB3640]/30 rounded-tl-2xl" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-[#FB3640]/30 rounded-br-2xl" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative pt-32 pb-12 px-6 z-10">
        <div className="max-w-7xl mx-auto border-t border-[#FB3640]/10 pt-12 flex flex-col md:flex-row items-center justify-between gap-8 text-[#FFF3E6]/40">
          <div className="flex items-center gap-4">
            <Link to="/team" className="px-6 py-3 rounded-full bg-[#FB3640]/5 border border-[#FB3640]/10 hover:border-[#FB3640]/40 transition-all">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FB3640]">Crafted by Team Nexus</p>
            </Link>
          </div>
          <div className="flex flex-col md:items-end gap-2 text-center md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FB3640]/40">© 2026 TEAM NEXUS • ALL RIGHTS RESERVED</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
