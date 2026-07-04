import logo from '../../assets/giet-logo.png';
import { ParticleTextEffect } from './particle-text-effect';

const AppLoader = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-slate-50 to-teal-50/50 overflow-hidden py-10 px-4">

            {/* Top Area (Empty for flex spacing) */}
            <div className="flex-none w-full h-8"></div>

            {/* Center Core Content */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-5xl">

                {/* Logo Section */}
                <div className="mb-6 relative group animate-apple-loader">
                    <img
                        src={logo}
                        alt="GIET Logo"
                        className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-xl"
                    />
                </div>

                {/* Subheading */}
                <div className="text-center w-full mb-2">
                    <p className="text-teal-600/80 font-bold tracking-[0.4em] uppercase text-[10px] md:text-[12px] animate-text-reveal">
                        INNOVATING EXCELLENCE
                    </p>
                </div>

                <div className="w-full h-[100px] md:h-[160px] relative animate-text-reveal [animation-delay:400ms]">
                    <ParticleTextEffect words={['GIET']} />
                </div>

                {/* Subtitle */}
                <div className="mt-4 overflow-hidden text-center">
                    <p className="text-xs md:text-sm font-semibold text-slate-500 tracking-[0.3em] uppercase animate-text-reveal [animation-delay:800ms]">
                        Management System
                    </p>
                </div>

                {/* Modern Loading Indicator */}
                <div className="mt-16 flex flex-col items-center gap-3 animate-text-reveal [animation-delay:1200ms] w-full max-w-[240px] md:max-w-xs mx-auto">
                    <div className="w-full h-1 bg-slate-200/60 relative overflow-hidden rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-500 animate-[progress_1.5s_ease-in-out_infinite] w-full"></div>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">
                        Initialising Secure Environment
                    </p>
                </div>
            </div>

            {/* Fixed Footer Area */}
            <div className="relative z-10 w-full flex justify-center pb-4 animate-text-reveal [animation-delay:1600ms]">
                <div className="flex items-center gap-4">
                    <div className="h-[1px] w-8 md:w-16 bg-slate-300" />
                    <div className="text-slate-400 text-[9px] md:text-[10px] tracking-[0.4em] uppercase font-bold text-center">
                        DESIGNED BY <span className="text-teal-600">TEAM NEXUS</span>
                    </div>
                    <div className="h-[1px] w-8 md:w-16 bg-slate-300" />
                </div>
            </div>
        </div>
    )
}

export default AppLoader;
