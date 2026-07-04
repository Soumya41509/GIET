import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Briefcase, Layout, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffApp = () => {
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
              Staff <span className="text-[#FB3640]">App</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-[#FFF3E6]/40 font-medium leading-relaxed mb-16 max-w-2xl mx-auto">
              The companion mobile app for staff, designed to manage grievances, track progress in real time, and ensure timely resolutions.
            </p>

            <div className="flex flex-col items-center gap-6">
              <a 
                href="/Staff.apk"
                download
                className="px-12 py-6 rounded-2xl bg-[#FB3640] text-[#000000] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-lg shadow-[#FB3640]/10 hover:scale-[1.02] transition-all whitespace-nowrap"
              >
                <Download size={20} /> Download APK
              </a>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#FB3640]/60 max-w-lg leading-relaxed">
                We are coming very soon to Play Store. Till then you can download the apk from above
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'Task Management', icon: <Layout />, desc: 'Organize and prioritize student reports effectively.' },
            { title: 'Secure Access', icon: <Shield />, desc: 'Role-based access control for faculty and staff members.' },
            { title: 'Performance Stats', icon: <Briefcase />, desc: 'Track resolution times and departmental efficiency.' }
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

export default StaffApp;
