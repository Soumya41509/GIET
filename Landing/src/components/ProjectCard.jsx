import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Download, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export function ProjectCard({ project, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="group relative h-full flex flex-col backdrop-blur-xl bg-white/40 hover:bg-white/80 rounded-[2rem] p-3 border border-black/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-700"
    >
      {/* Card Header/Visual */}
      <div className={cn(
        "relative aspect-video rounded-[1.5rem] overflow-hidden mb-4 transition-transform duration-700 group-hover:scale-[1.02]",
        project.visual.className
      )}>
        <img
          src={project.visual.image}
          alt={project.title}
          className="w-full h-full object-cover transition-all duration-1000 grayscale group-hover:grayscale-0 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />

        {/* Hover Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-full w-24 bg-accent-red/20 -skew-x-[45deg] translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out" />
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-2 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-accent-red/10 text-[9px] font-bold text-accent-navy/80 uppercase tracking-widest border border-accent-red/20">
              {tag}
            </span>
          ))}
        </div>

        <h3 className="text-xl font-black mb-1.5 text-accent-navy group-hover:text-accent-red transition-colors">
          {project.title}
        </h3>
        <p className="text-xs text-accent-slate font-bold mb-3">
          {project.subtitle}
        </p>
        <p className="text-accent-dark/40 text-xs leading-relaxed mb-5 line-clamp-2">
          {project.description}
        </p>

        <div className="mt-auto pt-3 flex flex-col gap-3 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-accent-navy/20 uppercase tracking-widest">
              {project.type}
            </span>
            <div className="flex items-center gap-2 text-accent-navy font-black text-xs group-hover:gap-3 transition-all">
              View Project
              <ArrowUpRight size={14} className="text-accent-red" />
            </div>
          </div>

          <div className="flex gap-2">
            {project.type === 'mobile' ? (
              <button
                onClick={(e) => { e.stopPropagation(); window.alert('Starting download...'); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-navy text-white text-xs font-black uppercase tracking-widest hover:bg-accent-red transition-colors"
              >
                <Download size={14} />
                Download App
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); window.alert('Opening console...'); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-navy text-white text-xs font-black uppercase tracking-widest hover:bg-accent-red transition-colors"
              >
                <ExternalLink size={14} />
                Open Console
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
