import React from 'react';
import { Shield, ArrowRight, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white pt-32 pb-12 px-6 relative overflow-hidden border-t border-black/5">
      {/* Decorative Background Element */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent-red/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between gap-20 mb-24">
          {/* Brand Column */}
          <div className="max-w-sm">
            <a href="#" className="flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-accent-red flex items-center justify-center p-0.5 group-hover:rotate-12 transition-transform duration-500">
                <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
                  <Shield className="text-accent-navy" size={20} />
                </div>
              </div>
              <span className="text-2xl font-black text-accent-navy tracking-tighter">
                GIET<span className="text-accent-red">.</span>
              </span>
            </a>
            <p className="text-lg text-accent-slate leading-relaxed mb-8">
              Building the future of campus life through simple, thoughtful digital experiences for our community.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24">
            <div>
              <h4 className="font-black text-accent-navy uppercase tracking-[0.2em] text-[10px] mb-8">
                Ecosystem
              </h4>
              <ul className="space-y-4">
                {['Student Portal', 'Staff Portal', 'Admin Console'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-accent-slate hover:text-accent-red transition-colors text-sm font-bold flex items-center gap-2 group">
                      {item}
                      <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-accent-navy uppercase tracking-[0.2em] text-[10px] mb-8">
                Campus
              </h4>
              <ul className="space-y-4">
                {['About Us', 'Digital GIET', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-accent-slate hover:text-accent-red transition-colors text-sm font-bold">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="font-black text-accent-navy uppercase tracking-[0.2em] text-[10px] mb-8">
                Location
              </h4>
              <p className="text-sm text-accent-slate font-medium leading-relaxed">
                GIET University<br />
                Gunupur, Odisha<br />
                India - 765022
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 rounded-full bg-accent-navy text-white">
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                Crafted by <span className="text-accent-red">Team Nexus</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-2">
            <p className="text-accent-slate text-[10px] font-bold uppercase tracking-[0.2em]">
              © 2026 GIET University. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[9px] font-black text-accent-slate/50 hover:text-accent-navy transition-colors uppercase tracking-[0.2em]">Privacy</a>
              <a href="#" className="text-[9px] font-black text-accent-slate/50 hover:text-accent-navy transition-colors uppercase tracking-[0.2em]">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
