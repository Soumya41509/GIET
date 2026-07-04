import React, { useRef } from 'react';
import { Quote } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const testimonials = [
  {
    name: 'Dr. G.K. Panda',
    role: 'Principal, GIET University',
    quote: 'Our commitment to a digital-first campus is realized through this portal. It bridge the gap between administration and students, fostering a culture of transparency and excellence.'
  },
  {
    name: 'Dr. Ramesh Kumar',
    role: 'Head of Department',
    quote: 'The efficiency of our departmental workflows has reached new heights. Real-time monitoring and automated grievance handling have truly modernized our academic operations.'
  },
  {
    name: 'Prof. S. Mohanty',
    role: 'Academic Guide',
    quote: 'Mentorship is most effective when communication is clear. This system ensures every student is supported and every concern is addressed with accountability and care.'
  }
];

export function TestimonialSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from('.testimonial-card', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
      },
      opacity: 0,
      x: -50,
      stagger: 0.2,
      duration: 0.8,
      ease: 'power2.out'
    });
  }, { scope: containerRef });

  return (
    <section id="testimonials" ref={containerRef} className="py-24 px-6 bg-surface relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4 text-accent-navy">Voice of the <span className="text-accent-red italic">Institution</span></h2>
          <p className="text-accent-slate">Insights from the leadership at GIET University.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card p-10 rounded-[2.5rem] bg-white border border-black/5 relative group shadow-sm hover:shadow-xl transition-all duration-500">
              <Quote className="absolute top-8 right-8 text-black/5 group-hover:text-accent-red/20 transition-colors" size={48} />
              <p className="text-lg text-accent-navy/70 italic mb-8 relative z-10">"{t.quote}"</p>
              <div>
                <h4 className="font-black text-accent-navy">{t.name}</h4>
                <p className="text-sm text-accent-slate font-bold uppercase tracking-widest">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
