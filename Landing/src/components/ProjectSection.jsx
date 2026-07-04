import React, { useRef } from 'react';

import { ProjectCard } from './ProjectCard';
import { PreviewModal } from './PreviewModal';
import gsap from 'gsap';
import { Apple, PlayCircle, Layout, Users, Shield, Terminal, ArrowUpRight, GraduationCap, Briefcase, Settings } from 'lucide-react';
import { useGSAP } from '@gsap/react';

const projects = [
  {
    title: 'Student',
    subtitle: 'Built for your success',
    description: 'Your all-in-one partner for university life. Check your schedule, track your progress, and stay on top of your studies with ease.',
    features: ['AI Study Planner', 'GPA Tracker', 'Class Schedules', 'Resource Library'],
    tags: ['Student Life', 'AI-Driven'],
    type: 'mobile',
    visual: {
      image: "/src/assets/images/student.png",
      className: 'bg-accent-red/10'
    },
    ctas: [
      { text: 'Download for Student', icon: <Apple size={18} />, href: '#', primary: true },
      { text: 'View Demo', icon: <PlayCircle size={18} />, href: '#', primary: false }
    ]
  },
  {
    title: 'Staff',
    subtitle: 'Supporting our teachers',
    description: 'Designed to make your day easier. Manage your classes, handle requests, and stay in touch with your department without the extra paperwork.',
    features: ['Attendance Mgmt', 'Leave Requests', 'Faculty Portal', 'Team Comms'],
    tags: ['Staff Portal', 'Enterprise'],
    type: 'mobile',
    visual: {
      image: "/src/assets/images/staff.png",
      className: 'bg-accent-slate/10'
    },
    ctas: [
      { text: 'Download for Staff', icon: <Apple size={18} />, href: '#', primary: true },
      { text: 'Staff Portal', icon: <Briefcase size={18} />, href: '#', primary: false }
    ]
  },
  {
    title: 'Admin',
    subtitle: 'Helping our campus run smoothly',
    description: 'A simple, powerful dashboard that helps you manage university life. Keep everything organized and make better decisions for our community.',
    features: ['Real-time Analytics', 'Data Management', 'Campus Control', 'Security Portal'],
    tags: ['Management', 'Big Data'],
    type: 'dashboard',
    visual: {
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop", // Fallback for now
      className: 'bg-accent-red/10'
    },
    ctas: [
      { text: 'Launch Admin Console', icon: <ArrowUpRight size={18} />, href: '#', primary: true },
      { text: 'Developer Docs', icon: <Terminal size={18} />, href: '#', primary: false }
    ]
  }
];

export function ProjectSection({ onSelectProject }) {
  const sectionRef = useRef(null);

  // Local animations removed to allow main App.jsx timeline to control the flow
  return (
    <section id="projects" ref={sectionRef} className="py-24 px-6 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="project-header text-center mb-12">
          <p className="text-accent-red font-bold tracking-widest uppercase text-xs mb-4">
            Built for GIET
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-accent-navy leading-tight">
            The Way We <span className="text-accent-red italic">Connect</span>
          </h2>
          <p className="text-accent-slate max-w-2xl mx-auto text-base leading-relaxed">
            Simple, modern tools that bring students, staff, and administration together. 
            We make it easy to focus on what really matters—growing and learning together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <div key={project.title} onClick={() => onSelectProject(project)} className="cursor-pointer">
              <ProjectCard project={project} index={i} />
            </div>
          ))}
        </div>
      </div>


    </section>
  );
}
