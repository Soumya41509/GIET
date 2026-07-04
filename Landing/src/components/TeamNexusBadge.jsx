import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TeamNexusBadge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100, y: -100 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 z-[400] pointer-events-none"
    >
      <Link 
        to="/team" 
        className="group pointer-events-auto block cursor-pointer transition-transform duration-300 hover:scale-105"
      >
        <div 
          className="w-16 h-16 md:w-24 md:h-24 bg-[#FB3640] relative flex items-center justify-center shadow-[0_0_30px_rgba(251,54,64,0.15)]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center pr-6 pb-6 md:pr-10 md:pb-10">
            <div className="rotate-[-45deg] flex flex-col items-center text-center leading-tight">
              <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-normal text-[#000000] mb-1">by</span>
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <span className="text-[9px] md:text-[13px] font-black uppercase tracking-[0.05em] text-[#000000] leading-none">team</span>
                <span className="text-[9px] md:text-[13px] font-black uppercase tracking-[0.05em] text-[#000000] leading-none">nexus</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default TeamNexusBadge;
