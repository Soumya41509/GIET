import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Download, ExternalLink, Shield, Users, Layout } from 'lucide-react';

export function ProjectPage({ project, onBack }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!project) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-accent-navy font-black uppercase tracking-widest text-xs hover:text-accent-red transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-accent-navy uppercase">
              GIET<span className="text-accent-red">.</span>
            </span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-8">
                {project.type === 'mobile' ? (
                  <div className="w-12 h-12 rounded-2xl bg-accent-red/10 flex items-center justify-center text-accent-red">
                    <Users size={24} />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-accent-navy/10 flex items-center justify-center text-accent-navy">
                    <Layout size={24} />
                  </div>
                )}
                <span className="text-xs font-black uppercase tracking-[0.3em] text-accent-slate">
                  {project.type === 'mobile' ? 'Mobile Application' : 'Web Dashboard'}
                </span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black mb-6 text-accent-navy leading-[0.9] tracking-tighter">
                {project.title}
              </h1>
              <p className="text-2xl font-bold text-accent-red italic mb-8">
                {project.subtitle}
              </p>
              <p className="text-xl text-accent-slate leading-relaxed mb-12 max-w-xl">
                {project.description}
              </p>

              <div className="space-y-4 mb-12">
                {project.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 text-accent-navy font-bold">
                    <CheckCircle2 className="text-accent-red" size={20} />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {project.type === 'mobile' ? (
                  <>
                    <button className="px-10 py-5 rounded-2xl bg-accent-navy text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all">
                      <Download size={20} />
                      Download App
                    </button>
                    <button className="px-10 py-5 rounded-2xl bg-accent-red/10 border border-accent-red/20 text-accent-navy font-black uppercase tracking-widest hover:bg-accent-red/20 transition-all text-center">
                      User Guide
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-10 py-5 rounded-2xl bg-accent-navy text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all">
                      <ExternalLink size={20} />
                      Launch Console
                    </button>
                    <button className="px-10 py-5 rounded-2xl bg-accent-red/10 border border-accent-red/20 text-accent-navy font-black uppercase tracking-widest hover:bg-accent-red/20 transition-all text-center">
                      Admin Portal
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-accent-red/5 blur-[120px] rounded-full" />
              <div className="relative rounded-[3rem] overflow-hidden border border-black/5 shadow-2xl">
                <img 
                  src={project.visual.image} 
                  alt={project.title} 
                  className="w-full aspect-square md:aspect-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
