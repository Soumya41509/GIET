import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, Layout, Shield, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export function PreviewModal({ project, onClose }) {
  if (!project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      >
        <div 
          className="absolute inset-0 bg-white/80 backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl backdrop-blur-xl bg-white/70 border border-black/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/5 hover:bg-black/10 text-accent-navy transition-colors"
          >
            <X size={24} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Visual Side */}
            <div className="relative aspect-square md:aspect-auto bg-surface p-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-red/20 to-accent-slate/20 blur-3xl opacity-50" />
              <img 
                src={project.visual.image} 
                alt={project.title} 
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl rounded-2xl grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>

            {/* Content Side */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {project.type === 'mobile' ? (
                      <div className="w-10 h-10 rounded-xl bg-accent-red/20 flex items-center justify-center text-accent-navy">
                        <Users size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-accent-slate/20 flex items-center justify-center text-accent-navy">
                        <Layout size={20} />
                      </div>
                    )}

                  </div>
                  <h2 className="text-4xl md:text-5xl font-black mb-4 text-accent-navy">
                    {project.title}
                  </h2>
                  <p className="text-xl font-bold text-accent-red italic mb-6">
                    {project.subtitle}
                  </p>
                </div>

                <p className="text-accent-slate leading-relaxed text-lg">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {project.features && project.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-accent-navy/50 font-bold uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  {project.ctas.map((cta, i) => (
                    <a
                      key={i}
                      href={cta.href}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-300",
                        cta.primary 
                          ? "bg-accent-navy text-white shadow-xl hover:scale-105" 
                          : "bg-accent-red text-white hover:bg-accent-red/80"
                      )}
                    >
                      {cta.icon}
                      {cta.text}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
