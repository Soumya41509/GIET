import React, { useRef } from 'react';
import { Shield, Globe, MessageSquare, Cpu } from 'lucide-react';

const features = [
  {
    icon: <MessageSquare className="text-blue-600" />,
    title: 'Voice Your Concern',
    description: 'Submit your grievances easily through the student app. We’ve made it simple for you to speak up and get help.',
    color: 'bg-blue-50'
  },
  {
    icon: <Globe className="text-rose-600" />,
    title: 'Check Status',
    description: 'Always know what is happening with your report. See exactly where it is and who is working on it.',
    color: 'bg-rose-50'
  },
  {
    icon: <Cpu className="text-amber-600" />,
    title: 'Nexa Chatbot',
    description: 'Need a quick answer? NexaChat is here 24/7 to help you find your way around the GIET campus and answer your questions.',
    color: 'bg-amber-50'
  },
  {
    icon: <Shield className="text-emerald-600" />,
    title: 'Solving Problems',
    description: 'Where the GIET team looks at every report and works together to make sure things are made right for you.',
    color: 'bg-emerald-50'
  }
];

export function FeatureSection() {
  const containerRef = useRef(null);

  // Local animations removed for main App.jsx timeline sync
  return (
    <section id="features" ref={containerRef} className="py-32 px-6 bg-[#e8ebf0] relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-red/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <div className="feature-header text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight text-accent-navy">
            Designed with <span className="text-accent-red">Care</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-8 text-xs font-bold text-accent-slate uppercase tracking-widest">
            {['Fast', 'Safe', 'Simple', 'Reliable'].map((tag) => (
              <span key={tag} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card group p-10 rounded-[2.5rem] bg-white border border-black/10 hover:border-accent-red/30 transition-all duration-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-2 flex flex-col h-full"
            >
              <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                {React.cloneElement(feature.icon, { size: 28, strokeWidth: 1.5 })}
              </div>
              
              <h3 className="text-2xl font-bold mb-5 text-accent-navy group-hover:text-accent-red transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-accent-slate text-[15px] leading-relaxed font-medium flex-grow">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
