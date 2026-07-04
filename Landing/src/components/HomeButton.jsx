import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const HomeButton = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <AnimatePresence>
      {!isHome && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: -50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, y: -50 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 right-0 z-[400]"
        >
          <Link 
            to="/" 
            className="group block cursor-pointer transition-transform duration-300 hover:scale-105"
          >
            <div 
              className="w-16 h-16 md:w-24 md:h-24 bg-[#FB3640] relative flex items-center justify-center shadow-[0_0_30px_rgba(251,54,64,0.15)]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
            >
              <div className="absolute inset-0 flex items-center justify-center pl-6 pb-6 md:pl-10 md:pb-10 translate-x-1 -translate-y-1">
                <div className="rotate-[45deg] flex flex-col items-center text-center leading-tight">
                  <ArrowLeft size={16} className="text-[#000000] mb-1" />
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-[#000000]">Home</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HomeButton;
