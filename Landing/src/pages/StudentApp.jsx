import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Shield, Users, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentApp = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFF3E6] font-['Outfit',sans-serif] selection:bg-[#FB3640]/30 relative overflow-x-hidden">

      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-none">
              Student <span className="text-[#FB3640]">App</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-[#FFF3E6]/40 font-medium leading-relaxed mb-16 max-w-2xl mx-auto">
              Your mobile companion for instant grievance reporting, real-time tracking, and automated support from Nexa Chatbot.
            </p>

            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <a 
                  href="/Student.apk"
                  download
                  className="px-12 py-6 rounded-2xl bg-[#FB3640] text-[#000000] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-lg shadow-[#FB3640]/10 hover:scale-[1.02] transition-all whitespace-nowrap"
                >
                  <Download size={20} /> Download APK
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=in.gietgrievance.student"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-12 py-6 rounded-2xl border border-[#FB3640]/20 text-[#FB3640] font-black uppercase tracking-[0.3em] hover:bg-[#FB3640]/5 transition-all whitespace-nowrap"
                >
                  Join as Tester
                </a>
              </div>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#FB3640]/60 max-w-lg leading-relaxed">
                We are coming very soon to Play Store. Till then you can join us as a tester by clicking above
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'One-Tap Reporting', icon: <Smartphone />, desc: 'Submit concerns in seconds with a simplified mobile interface.' },
            { title: 'Status Tracking', icon: <Shield />, desc: 'Get live updates on the progress of your grievance resolution.' },
            { title: 'Nexa Chatbot', icon: <Users />, desc: 'Get instant answers to campus-related queries anytime.' }
          ].map((f, i) => (
            <div key={i} className="p-10 rounded-[2.5rem] border border-[#FB3640]/10 bg-[#000000] group hover:border-[#FB3640]/50 transition-all duration-500 shadow-[0_0_20px_rgba(251,54,64,0.05)] hover:shadow-[0_0_40px_rgba(251,54,64,0.15)]">
              <div className="text-[#FB3640]/60 mb-8 group-hover:text-[#FB3640] transition-colors">{f.icon}</div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-widest">{f.title}</h3>
              <p className="text-[#FFF3E6]/30 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 border-t border-[#FB3640]/10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FB3640]/40">© 2026 TEAM NEXUS • ALL RIGHTS RESERVED</p>
      </footer>
    </div>
  );
};

export default StudentApp;
