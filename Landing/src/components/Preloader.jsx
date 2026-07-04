import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Shield } from 'lucide-react';

export function Preloader() {
  const containerRef = useRef(null);
  const panelsRef = useRef([]);
  const contentRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        if (containerRef.current) {
          containerRef.current.style.display = 'none';
        }
      }
    });

    // Initial state
    tl.set(contentRef.current, { opacity: 0, y: 20 });
    tl.set(panelsRef.current, { scaleY: 1 });

    // Reveal Content
    tl.to(contentRef.current, { 
      opacity: 1, 
      y: 0,
      duration: 1, 
      ease: 'power4.out' 
    })
    .to(contentRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      delay: 0.5,
      ease: 'power4.in'
    });

    // Curtain Opening Animation
    tl.to(panelsRef.current, {
      scaleY: 0,
      duration: 1.2,
      stagger: {
        amount: 0.4,
        from: 'center'
      },
      transformOrigin: 'top',
      ease: 'expo.inOut'
    });

  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] flex overflow-hidden pointer-events-auto"
    >
      {/* 4 Panels for a premium reveal */}
      {[...Array(4)].map((_, i) => (
        <div 
          key={i}
          ref={el => panelsRef.current[i] = el}
          className="h-full w-1/4 bg-accent-navy border-r border-white/5"
          style={{ 
            backgroundColor: i % 2 === 0 ? '#1e1b4b' : '#1a1842'
          }}
        />
      ))}

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <div ref={contentRef} className="flex flex-col items-center gap-6">
          <div className="relative">
            <img 
              src="/giet_logo.png" 
              alt="GIET Logo" 
              className="w-48 h-48 object-contain drop-shadow-[0_0_30px_rgba(185,28,28,0.3)]"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-24 h-24 rounded-3xl bg-accent-red items-center justify-center p-1 shadow-2xl">
              <div className="w-full h-full rounded-2xl bg-accent-navy flex items-center justify-center">
                <Shield className="text-white" size={48} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
