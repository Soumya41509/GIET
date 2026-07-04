import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function Hero() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useGSAP(() => {
    if (isMobile) return;

    // Entrance Animation
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.5 } });
    tl.from('.hero-headline span', {
      y: 120,
      opacity: 0,
      stagger: 0.15,
      rotateX: -40,
      transformOrigin: 'top'
    });

    // High-performance mouse follow (QuickTo)
    const xTo = gsap.quickTo(contentRef.current, "x", { duration: 0.8, ease: "power3" });
    const yTo = gsap.quickTo(contentRef.current, "y", { duration: 0.8, ease: "power3" });
    const rotateYTo = gsap.quickTo(contentRef.current, "rotationY", { duration: 0.8, ease: "power3" });
    const rotateXTo = gsap.quickTo(contentRef.current, "rotationX", { duration: 0.8, ease: "power3" });

    const handleMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPos = (clientX / innerWidth - 0.5);
      const yPos = (clientY / innerHeight - 0.5);

      xTo(xPos * 60);
      yTo(yPos * 40);
      rotateYTo(xPos * 15);
      rotateXTo(yPos * -15);
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, { scope: containerRef, dependencies: [isMobile] });

  return (
    <section 
      ref={containerRef}
      className="hero-section relative h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6 bg-[#e8ebf0] perspective-2000"
    >
      {/* FIXED Background Image - Cinematic ND Filter Look */}
      <div className="fixed inset-0 z-0 bg-[#e8ebf0] pointer-events-none">
        <img 
          src="/bn1.jpg" 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none brightness-[0.8] contrast-[1.25] translate-z-0"
        />
        {/* Cinematic Overlays - HEAVY BOTTOM ANCHOR */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#e8ebf0]/5 z-[2]" />
      </div>

      {/* Content wrapper for side-scroll sync & 3D Mouse Tilt */}
      <div
        ref={contentRef}
        className="hero-content relative z-10 text-center max-w-5xl mx-auto pointer-events-none will-change-transform"
      >
        <h1 className="hero-headline text-5xl md:text-[12rem] font-black tracking-tighter mb-4 leading-[0.8] text-accent-red uppercase">
          <span className="inline-block">GIET</span>
        </h1>

        <h2 className="hero-headline text-3xl md:text-6xl font-black tracking-tighter mb-12 leading-[0.9] text-accent-navy italic">
          <span className="inline-block">Grievance Redressal System</span>
        </h2>
      </div>
    </section>
  );
}
