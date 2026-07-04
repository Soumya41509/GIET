import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const ComingSoon = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { damping: 30, stiffness: 150 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 150 });

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e) => {
      if (!isMobile) {
        mouseX.set(e.clientX - 400);
        mouseY.set(e.clientY - 400);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobile]);

  return (
    <div className="min-h-screen h-screen bg-[#000f08] flex flex-col items-center justify-center p-4 md:p-8 font-['Outfit',sans-serif] overflow-hidden relative">
      {/* Noise Texture Overlay to prevent banding/layering */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* High-Visibility Flowing Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Mouse Tracking Glow (Desktop Only) */}
        {!isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            style={{ 
              x: springX,
              y: springY,
            }}
            className="absolute w-[800px] h-[800px] bg-[#FB3640]/20 rounded-full blur-[200px] md:blur-[250px] z-0 will-change-transform"
          />
        )}

        {/* Ambient Flowing Glows */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={isMobile ? { 
            opacity: 1,
            x: ['-10%', '10%', '0%', '-10%'],
            y: ['-10%', '10%', '10%', '-10%'],
          } : {
            opacity: 1,
            x: ['0%', '10%', '-10%', '0%'],
            y: ['0%', '-10%', '10%', '0%'],
          }}
          transition={{ 
            opacity: { duration: 2 },
            x: { duration: 25, repeat: Infinity, ease: "linear" },
            y: { duration: 25, repeat: Infinity, ease: "linear" }
          }}
          className={`absolute top-1/4 left-1/4 w-[100vw] h-[100vw] bg-[#FB3640]/${isMobile ? '8' : '16'} rounded-full ${isMobile ? 'blur-[100px]' : 'blur-[200px] md:blur-[300px]'} will-change-transform`} 
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={isMobile ? { 
            opacity: 1,
            x: ['10%', '-10%', '0%', '10%'],
            y: ['10%', '-10%', '-10%', '10%'],
          } : {
            opacity: 1,
            x: ['0%', '-10%', '10%', '0%'],
            y: ['0%', '10%', '-10%', '0%'],
          }}
          transition={{ 
            opacity: { duration: 2, delay: 0.2 },
            x: { duration: 30, repeat: Infinity, ease: "linear" },
            y: { duration: 30, repeat: Infinity, ease: "linear" }
          }}
          className={`absolute bottom-1/4 right-1/4 w-[80vw] h-[80vw] bg-[#FB3640]/${isMobile ? '5' : '12'} rounded-full ${isMobile ? 'blur-[100px]' : 'blur-[200px] md:blur-[300px]'} will-change-transform`} 
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center h-full justify-between pt-12 pb-6 md:pt-20 md:pb-10">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 md:mb-16 w-full"
          >
            <h1 className={`text-[18vw] md:text-[13rem] font-black leading-[0.8] tracking-[0.1em] md:tracking-[0.2em] uppercase mb-6 md:mb-12 text-[#FB3640] ${isMobile ? 'drop-shadow-[0_0_15px_rgba(251,54,64,0.3)]' : 'drop-shadow-[0_0_60px_rgba(251,54,64,0.4)]'}`}>
              GIET
            </h1>
            <h2 className="text-xl md:text-5xl font-black tracking-[0.05em] md:tracking-[0.1em] mb-8 md:mb-12 leading-[0.9] text-[#FFF3E6]">
              Grievance Redressal System
            </h2>
            <div className="h-px w-24 md:w-48 bg-[#FB3640]/30 mx-auto" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center w-full"
          >
            <h3 className={`text-3xl md:text-7xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 md:mb-10 text-[#FB3640] ${isMobile ? 'drop-shadow-[0_0_10px_rgba(251,54,64,0.2)]' : 'drop-shadow-[0_0_30px_rgba(251,54,64,0.2)]'}`}>
              Coming Soon
            </h3>
            <p className="text-base md:text-2xl font-bold italic text-white/70 max-w-3xl leading-relaxed px-4">
              "Better experiences are worth the wait.<br />We are crafting something special for you."
            </p>
          </motion.div>
        </div>

        {/* Minimalist Red Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col items-center gap-2 md:gap-4 w-full"
        >
          <div className="h-px w-12 md:w-32 bg-[#FB3640]/20 mb-2" />
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[#FB3640] text-center">
            <span>All Rights Reserved</span>
            <span className="hidden md:inline text-white/20">•</span>
            <span>Copyright © 2026</span>
          </div>
        </motion.div>
      </div>

      {/* Solid Red Corner Triangle Branding (Top-Left) */}
      <motion.div
        initial={{ opacity: 0, x: -100, y: -100 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
        className="absolute top-0 left-0 z-50 pointer-events-none"
      >
        <div 
          className="w-16 h-16 md:w-24 md:h-24 bg-[#FB3640] relative flex items-center justify-center shadow-[0_0_30px_rgba(251,54,64,0.15)]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center pr-6 pb-6 md:pr-10 md:pb-10">
            <div className="rotate-[-45deg] flex flex-col items-center text-center leading-tight">
              <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-normal text-[#000f08] mb-1">by</span>
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <span className="text-[9px] md:text-[13px] font-black uppercase tracking-[0.2em] text-[#000f08] leading-none">team</span>
                <span className="text-[9px] md:text-[13px] font-black uppercase tracking-[0.2em] text-[#000f08] leading-none">nexus</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
