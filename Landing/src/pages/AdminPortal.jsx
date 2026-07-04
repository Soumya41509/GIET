import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Layout, Shield, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPortal = () => {
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
              Admin <span className="text-[#FB3640]">Panel</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-[#FFF3E6]/40 font-medium leading-relaxed mb-16 max-w-2xl mx-auto">
              Centralized command center for real-time analytics, user management, and campus-wide grievance oversight.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <a 
                href="https://admin.gietgrievance.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-12 py-6 rounded-2xl bg-[#FB3640] text-[#000000] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-lg shadow-[#FB3640]/10 hover:scale-[1.02] transition-all"
              >
                <ExternalLink size={20} /> Launch
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'Real-time Analytics', icon: <Cpu />, desc: 'Visualize trends and resolution performance across the campus.' },
            { title: 'System Security', icon: <Shield />, desc: 'End-to-end encryption and audit logs for all administrative actions.' },
            { title: 'User Management', icon: <Layout />, desc: 'Manage permissions and roles for staff and student accounts.' }
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

export default AdminPortal;
