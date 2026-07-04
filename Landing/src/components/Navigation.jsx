import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      animate={{ 
        backgroundColor: isScrolled ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: isScrolled ? 'blur(24px)' : 'blur(0px)',
        borderBottomColor: isScrolled ? 'rgba(251, 54, 64, 0.1)' : 'rgba(251, 54, 64, 0)'
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-[300] border-b"
    >
      <div className="max-w-7xl mx-auto h-16 md:h-24 px-8 flex items-center justify-end">
        {/* Navigation Links - Always Visible */}
        <div className="flex items-center gap-8 md:gap-12">
          <Link 
            to="/" 
            className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-300 ${
              location.pathname === '/' ? 'text-[#FB3640]' : 'text-[#FFF3E6]/40 hover:text-[#FB3640]'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/team" 
            className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-300 ${
              location.pathname === '/team' ? 'text-[#FB3640]' : 'text-[#FFF3E6]/40 hover:text-[#FB3640]'
            }`}
          >
            Team
          </Link>
          <a 
            href="/#ecosystem"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFF3E6]/40 hover:text-[#FB3640] transition-all duration-300"
          >
            Explore
          </a>
          <button className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFF3E6]/40 hover:text-[#FB3640] transition-all duration-300">
            Docs
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
