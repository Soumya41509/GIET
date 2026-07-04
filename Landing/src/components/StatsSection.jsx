import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Network, ShieldCheck, Zap, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function StatsSection() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    const numbers = sectionRef.current.querySelectorAll('.stat-number');
    
    numbers.forEach((num) => {
      const target = parseInt(num.getAttribute('data-target'));
      gsap.to(num, {
        innerText: target,
        duration: 2,
        snap: { innerText: 1 },
        scrollTrigger: {
          trigger: num,
          start: 'top 90%',
        }
      });
    });

    gsap.from('.stat-card', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
      },
      y: 50,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out'
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-cyan/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter italic text-accent-dark">
            Campus by the <span className="text-accent-cyan">Numbers</span>
          </h2>
          <p className="text-accent-slate max-w-2xl mx-auto text-lg">
            Every day, we help thousands of students and staff stay connected and get things done.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: <Database />, label: 'Requests Handled', value: '25', suffix: 'M+', target: 25 },
            { icon: <Users />, label: 'Daily Users', value: '15', suffix: 'K+', target: 15 },
            { icon: <Zap />, label: 'Reliability', value: '99', suffix: '.9%', target: 99 },
            { icon: <ShieldCheck />, label: 'Protected Data', value: '12', suffix: '8-bit', target: 128 },
          ].map((stat, i) => (
            <div 
              key={i} 
              className="stat-card p-8 rounded-[2rem] bg-surface border border-black/5 backdrop-blur-sm hover:border-accent-cyan/50 transition-colors group shadow-sm hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/20 flex items-center justify-center text-accent-dark mb-6 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="stat-number text-4xl font-black text-accent-dark" data-target={stat.target}>
                  0
                </span>
                <span className="text-2xl font-bold text-accent-cyan">{stat.suffix}</span>
              </div>
              <p className="text-accent-slate font-bold uppercase tracking-widest text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
