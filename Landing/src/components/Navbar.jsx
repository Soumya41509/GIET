import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, Shield, X } from 'lucide-react';
import { cn } from '../lib/utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const navLinks = [
  { name: 'Solutions', href: '#projects' },
  { name: 'Features', href: '#features' },
  { name: 'Community', href: '#testimonials' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useGSAP(() => {
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
      delay: 0.5
    });
  }, { scope: navRef });

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-6",
        isScrolled ? "py-4" : "py-8"
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto flex items-center justify-between rounded-[2.5rem] border transition-all duration-500 px-8 py-3",
        isScrolled 
          ? "border-accent-red/20 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)]" 
          : "border-black/5 bg-white/40 backdrop-blur-md shadow-none"
      )}>
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent-red flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform">
            <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
              <Shield className="text-accent-navy" size={20} />
            </div>
          </div>
          <span className="text-xl font-black tracking-tighter text-accent-navy">
            GIET<span className="text-accent-red">.</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-bold text-accent-slate hover:text-accent-navy transition-colors tracking-wide"
            >
              {link.name}
            </a>
          ))}
          <a
            href="#contact"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-navy text-white text-sm font-black hover:scale-105 transition-all shadow-lg"
          >
            Access Portal
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-accent-navy/70"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-2xl flex flex-col p-8 md:hidden"
          >
            <div className="flex justify-end mb-12">
              <button onClick={() => setIsOpen(false)} className="p-2 bg-black/5 rounded-full">
                <X size={32} />
              </button>
            </div>
            <div className="flex flex-col gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-4xl font-black tracking-tighter text-accent-navy hover:text-accent-red transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#"
                className="mt-8 flex items-center justify-between p-6 rounded-3xl bg-surface border border-black/5"
              >
                <span className="text-xl font-bold text-accent-navy">Access Portal</span>
                <ArrowRight className="text-accent-red" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
