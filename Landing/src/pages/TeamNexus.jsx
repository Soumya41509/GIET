import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Send, MessageSquare, Mail, Code, Palette, Zap, Users as UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';

const TeamNexus = () => {
  const [hodImageError, setHodImageError] = useState(false);
  const [guideImageError, setGuideImageError] = useState(false);
  useEffect(() => {
    const lenis = new Lenis();
    lenis.scrollTo(0, { immediate: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFF3E6] font-['Outfit',sans-serif] selection:bg-[#FB3640]/30 relative overflow-x-hidden">


      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 pt-32">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#FB3640] mb-12 block">Architects of Innovation</span>
            <h1 className="text-6xl md:text-[11rem] font-black uppercase tracking-tighter mb-12 leading-[0.8]">
              TEAM<br /><span className="text-[#FB3640]">NEXUS</span>
            </h1>
            <div className="h-px w-32 bg-[#FB3640]/30 mx-auto mb-16" />
            <p className="text-xl md:text-4xl text-[#FFF3E6]/40 font-medium leading-relaxed max-w-4xl mx-auto">
              A collective of visionary developers and designers committed to redefining digital experiences at GIET.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-48 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            {
              title: 'Design',
              desc: "Design is the heart of everything we create. It's about empathy, understanding the human journey, and crafting interfaces that feel like a natural extension of the user's hand. We believe every pixel should serve a purpose, and every interaction should feel effortless. Our goal is to blend high-end aesthetics with flawless functionality to make technology feel genuinely human."
            },
            {
              title: 'Development',
              desc: "Code is our canvas. We build robust, scalable architectures designed to withstand the test of time. Beyond just syntax, we focus on performance, security, and accessibility, ensuring our digital solutions are inclusive and high-performing for everyone. From seamless mobile apps to complex web ecosystems, we turn vision into reality with precision and passion."
            },
            {
              title: 'Innovation',
              desc: "We are the dreamers and the doers. Innovation at GIET isn't just about trends; it's about solving real-world challenges with creativity and grit. We explore the frontiers of AI, automation, and emerging tech to create a smarter, more connected campus. Our mission is to constantly push the boundaries of what's possible, making every day at our university more efficient and inspiring."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="group p-14 rounded-[2.5rem] bg-[#FB3640]/[0.03] border border-[#FB3640]/20 shadow-[0_0_50px_rgba(251,54,64,0.06)] relative overflow-hidden transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FB3640]/30 to-transparent" />
              <h3 className="text-3xl font-black mb-6 uppercase tracking-[0.2em] text-[#FB3640] text-center">
                <span className="-mr-[0.2em] inline-block">{item.title}</span>
              </h3>
              <div className="h-px w-12 bg-[#FB3640]/30 mx-auto mb-8" />
              <p className="text-[#FFF3E6]/50 text-base leading-relaxed font-medium text-center">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Meet The Minds Section */}
      <section className="py-48 px-6 bg-[#000000]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-32 text-center"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#FB3640] mb-8 block">Project Leadership</span>
            <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tight mb-12">🚀 Meet The <span className="text-[#FB3640]">Minds</span></h2>
            <div className="h-px w-32 bg-[#FB3640]/30 mx-auto" />
          </motion.div>

          <div className="space-y-32">
            {/* The Visionary — HOD */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group min-h-[500px] rounded-[4rem] bg-[#000000] border border-[#FB3640]/10 hover:border-[#FB3640]/30 transition-all duration-1000 relative overflow-hidden flex flex-col md:flex-row-reverse"
            >
              <div className="w-full md:w-[35%] h-[420px] bg-[#FB3640]/5 relative flex-shrink-0 flex flex-col overflow-hidden">
                <div className="relative flex-1 overflow-hidden">
                  {!hodImageError ? (
                    <img
                      src="/hod.jpeg"
                      alt="HOD"
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      onError={() => setHodImageError(true)}
                    />
                  ) : (
                    <UsersIcon size={120} className="text-[#FB3640]/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#000000] hidden md:block z-20" />
                </div>
                <div className="px-8 py-6 border-t border-[#FB3640]/10 bg-[#000000] z-30 relative">
                  <p className="text-xl font-black text-[#FFF3E6] tracking-tight">Prof. Sidhanta Ku. Balabantaray</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FB3640] mt-1">Head of Department</p>
                </div>
              </div>
              <div className="p-12 md:p-20 flex-1 relative text-right md:text-left flex flex-col justify-center">
                <span className="text-xl font-black uppercase tracking-[0.4em] text-[#FB3640] mb-8 block drop-shadow-[0_0_20px_rgba(251,54,64,0.4)]">“The Man Behind the Idea”</span>
                <div className="space-y-8 max-w-3xl ml-auto md:ml-0">
                  <p className="text-[#FFF3E6]/60 text-xl leading-relaxed font-medium italic">
                    "Every great system begins with a thought that challenges the existing way of doing things. This project was inspired by a vision to bring transparency, accountability, and ease into the grievance process."
                  </p>
                  <p className="text-[#FFF3E6]/60 text-xl leading-relaxed font-medium italic">
                    "The belief was simple — technology should not just exist, it should solve real problems. And this project is a direct reflection of that philosophy."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* The Mentor — Project Guide */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group min-h-[500px] rounded-[4rem] bg-[#000000] border border-[#FB3640]/10 hover:border-[#FB3640]/30 transition-all duration-1000 relative overflow-hidden flex flex-col md:flex-row"
            >
              <div className="w-full md:w-[35%] h-[420px] bg-[#FB3640]/5 relative flex-shrink-0 flex flex-col overflow-hidden">
                <div className="relative flex-1 overflow-hidden">
                  {!guideImageError ? (
                    <img
                      src="/guide.jpeg"
                      alt="Project Guide"
                      className="absolute inset-0 w-full h-full object-cover z-10 scale-110"
                      onError={() => setGuideImageError(true)}
                    />
                  ) : (
                    <UsersIcon size={120} className="text-[#FB3640]/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#000000] hidden md:block z-20" />
                </div>
                <div className="px-8 py-6 border-t border-[#FB3640]/10 bg-[#000000] z-30 relative">
                  <p className="text-xl font-black text-[#FFF3E6] tracking-tight">Prof. Smarak Ku. Nayak</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FB3640] mt-1">Project Guide</p>
                </div>
              </div>
              <div className="p-12 md:p-20 flex-1 relative flex flex-col justify-center">
                <span className="text-xl font-black uppercase tracking-[0.4em] text-[#FB3640] mb-8 block drop-shadow-[0_0_20px_rgba(251,54,64,0.4)]">“The Force That Shaped It”</span>
                <div className="space-y-6 max-w-3xl">
                  <p className="text-[#FFF3E6]/60 text-lg leading-relaxed font-medium italic">
                    "Ideas need direction, and execution needs precision. With continuous mentorship and technical expertise, this project evolved from a concept into a robust system."
                  </p>
                  <p className="text-[#FFF3E6]/60 text-lg leading-relaxed font-medium italic">
                    "From refining workflows to ensuring usability and performance, every phase of development was guided with clarity and purpose. This mentorship transformed challenges into learning opportunities."
                  </p>
                  <p className="text-[#FFF3E6]/60 text-lg leading-relaxed font-medium italic">
                    "This guidance not only improved the project quality but also helped shape a disciplined and solution-oriented approach within the team."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* The Dynamic Duo — Unified Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group min-h-[450px] rounded-[4rem] bg-[#000000] border border-[#FB3640]/10 hover:border-[#FB3640]/30 transition-all duration-1000 relative overflow-hidden flex flex-col md:flex-row"
            >
              <div className="w-full md:w-2/5 min-h-[350px] bg-[#FB3640]/5 relative overflow-hidden flex-shrink-0 flex items-center justify-center p-12 self-stretch">
                <div className="flex -space-x-8">
                  <div className="relative z-20">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-[#000000] overflow-hidden shadow-2xl relative">
                      <img src="/soumya.jpg" alt="Soumya" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FB3640] px-4 py-1 rounded-full z-30">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#0D0D0D]">ER.Soumyaranjan</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-[#000000] overflow-hidden shadow-2xl relative">
                      <img src="/sitesh.jpeg" alt="Sitesh" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FB3640] px-4 py-1 rounded-full z-30">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#0D0D0D]">ER.Sitesh</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#000000] hidden md:block z-40" />
              </div>
              <div className="p-12 md:p-20 flex-1 relative flex flex-col justify-center">
                <span className="text-xl font-black uppercase tracking-[0.4em] text-[#FB3640] mb-8 block drop-shadow-[0_0_20px_rgba(251,54,64,0.4)]">⚡ The Dynamic Duo</span>
                <div className="space-y-8 max-w-3xl">
                  <p className="text-[#FFF3E6]/60 text-xl leading-relaxed font-medium italic">
                    "At the heart of the system lies the engine built by two dedicated developers who turned vision into reality. From designing the architecture to implementing seamless backend logic and responsive frontend interfaces, this duo handled the core development with precision."
                  </p>
                  <p className="text-[#FFF3E6]/60 text-xl leading-relaxed font-medium italic">
                    "Late nights, debugging sessions, and constant iterations — their journey was driven by problem-solving, innovation, and a commitment to building something meaningful."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* The Power Trio */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group min-h-[500px] rounded-[4rem] bg-[#000000] border border-[#FB3640]/10 hover:border-[#FB3640]/30 transition-all duration-1000 relative overflow-hidden flex flex-col md:flex-row-reverse"
            >
              <div className="w-full md:w-2/5 min-h-[400px] bg-[#FB3640]/5 relative overflow-hidden flex-shrink-0 flex items-center justify-center p-12 self-stretch">
                <div className="flex flex-col items-center gap-12">
                  {/* Top: Swarna */}
                  <div className="relative">
                    <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#000000] overflow-hidden shadow-2xl relative">
                      <img src="/swarna.jpeg" alt="Swarna" className="w-full h-full object-cover object-top" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FB3640] px-3 py-1 rounded-full z-40">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#0D0D0D]">Er.Swarna</p>
                    </div>
                  </div>

                  {/* Bottom: Bijayini and Mousumi */}
                  <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    <div className="relative">
                      <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#000000] overflow-hidden shadow-2xl relative">
                        <img src="/bijayini.jpeg" alt="Bijayini" className="w-full h-full object-cover object-[center_15%] brightness-110 contrast-110" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FB3640] px-3 py-1 rounded-full z-40">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#0D0D0D]">Er.Bijayini</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#000000] overflow-hidden shadow-2xl relative">
                        <img src="/mousumi.jpeg" alt="Mousumi" className="w-full h-full object-cover object-top" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FB3640] px-3 py-1 rounded-full z-40">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#0D0D0D]">ER.Mousumi</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#000000] hidden md:block z-50" />
              </div>
              <div className="p-12 md:p-20 flex-1 relative flex flex-col justify-center text-right md:text-left">
                <span className="text-xl font-black uppercase tracking-[0.4em] text-[#FB3640] mb-8 block drop-shadow-[0_0_20px_rgba(251,54,64,0.4)]">🌟 The Power Trio</span>
                <div className="space-y-8 max-w-3xl ml-auto md:ml-0">
                  <p className="text-[#FFF3E6]/60 text-xl leading-relaxed font-medium italic">
                    "A system is only as good as the experience it delivers — and that’s where this creative trio stepped in. They focused on making the platform not just functional, but intuitive, clean, and user-friendly."
                  </p>
                  <p className="text-[#FFF3E6]/60 text-xl leading-relaxed font-medium italic">
                    "Their combined efforts bridge design and code, making the entire experience seamless and engaging for every student. From crafting visually appealing interfaces to supporting frontend development, they brought life to the project."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Team Spirit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-32 p-12 md:p-24 rounded-[4rem] bg-[#FB3640]/[0.02] border border-[#FB3640]/10 text-center relative overflow-hidden group"
          >
            {/* Background Image Accent */}
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000">
              <img src="/team_spirit.jpg" alt="" className="w-full h-full object-cover grayscale" />
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#FB3640]/40 to-transparent" />
            <span className="text-xl font-black uppercase tracking-[0.4em] text-[#FB3640] mb-8 block relative z-10 drop-shadow-[0_0_20px_rgba(251,54,64,0.4)]">🔥 Team Spirit</span>
            <p className="text-2xl md:text-4xl text-[#FFF3E6]/70 leading-relaxed font-medium max-w-5xl mx-auto italic mb-12 relative z-10">
              "Five individuals, different skill sets, one shared vision. Collaboration, creativity, and consistency defined this journey. Together, we didn’t just develop an application — we built a solution aimed at creating real impact."
            </p>
            <div className="h-px w-20 bg-[#FB3640]/20 mx-auto mb-12 relative z-10" />

            {/* Core Team Gallery */}
            <div className="flex flex-wrap justify-center gap-6 mb-12 relative z-10">
              {[
                { src: "/soumya.jpg", name: "Soumya" },
                { src: "/sitesh.jpeg", name: "Sitesh" },
                { src: "/swarna.jpeg", name: "Swarna" },
                { src: "/bijayini.jpeg", name: "Bijayini" },
                { src: "/mousumi.jpeg", name: "Mousumi" }
              ].map((member, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10, scale: 1.1 }}
                  className="relative group/member"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#FB3640]/20 overflow-hidden bg-[#000000] p-1">
                    <img
                      src={member.src}
                      alt={member.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/member:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#FB3640]">{member.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-xs font-black uppercase tracking-[0.5em] text-[#FB3640]/40 relative z-10">Innovation Meets Purpose</p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-48 px-6 bg-[#FB3640]/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-7xl font-black uppercase tracking-tight mb-16">Our <span className="text-[#FB3640]">Mission</span></h2>
          <p className="text-xl md:text-3xl text-[#FFF3E6]/60 leading-relaxed font-medium italic">
            "To bridge the gap between technology and campus life, creating a seamless ecosystem where every concern is heard and every solution is just a tap away."
          </p>
        </div>
      </section>



      <footer className="py-12 border-t border-[#FB3640]/10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FB3640]/40">© 2026 TEAM NEXUS • ALL RIGHTS RESERVED</p>
      </footer>
    </div>
  );
};

export default TeamNexus;
