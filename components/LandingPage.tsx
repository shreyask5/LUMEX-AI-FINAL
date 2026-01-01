import React from 'react';
import Particles from 'react-tsparticles';
import { useCallback } from 'react';
import { loadSlim } from 'tsparticles-slim';

interface LandingPageProps {
  onInitialize: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onInitialize }) => {
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Righteous&family=Bree+Serif&display=swap');

        html, body, #root {
          overflow-y: auto !important;
          overflow-x: hidden;
          height: auto;
          min-height: 100vh;
        }

        .righteous-regular {
          font-family: 'Righteous', sans-serif;
          font-weight: 400;
          font-style: normal;
        }

        .bree-serif-regular {
          font-family: 'Bree Serif', serif;
          font-weight: 400;
          font-style: normal;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2); }
          50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3); }
        }

        .glow-button {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .glow-button:hover {
          animation: none;
          box-shadow: 0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(251, 191, 36, 0.4);
        }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      `}</style>

      {/* Animated Tech Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="fixed inset-0 z-0"
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 120,
          particles: {
            color: {
              value: "#FBBF24",
            },
            links: {
              color: "#FBBF24",
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 1,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 50,
            },
            opacity: {
              value: 0.3,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
      />

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-yellow-600/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Background grid pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(to right, rgb(251, 191, 36) 1px, transparent 1px), linear-gradient(to bottom, rgb(251, 191, 36) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      <div className="relative z-10 flex flex-col min-h-full">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center mt-16 sm:mt-24 md:mt-[140px] mb-12 md:mb-20 justify-center px-4 sm:px-6 py-8 sm:py-12 md:py-20 text-center max-w-6xl mx-auto w-full">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-amber-400 font-semibold tracking-widest text-xs sm:text-sm uppercase righteous-regular">Spatial Intelligence System</h2>

              {/* Big Title - Bree Serif Style */}
              <h1 className="text-[64px] xs:text-[80px] sm:text-[120px] md:text-[180px] lg:text-[220px] font-bold bree-serif-regular leading-none tracking-tight px-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-blue-500">LUMEX</span>{' '}
                <span className="text-white">AI</span>
              </h1>

              {/* Tagline */}
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 righteous-regular px-2">
                See the world in a new dimension.
              </p>

              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed pt-2 sm:pt-4 px-2">
                An advanced visual assistant for the visually impaired. Utilizing a modular multimodal architecture to perceive, interpret, and navigate complex environments in real-time.
              </p>
            </div>

            <div className="pt-6 sm:pt-8 pb-8 sm:pb-12">
              <button
                onClick={onInitialize}
                className="glow-button relative px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl md:text-2xl font-semibold text-white bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 border border-amber-400/50 rounded-full hover:from-amber-800 hover:via-amber-700 hover:to-amber-800 hover:border-amber-300 hover:scale-105 transition-all duration-300 righteous-regular backdrop-blur-sm"
              >
                <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse"></span>
                  Initialize System
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 flex items-center justify-center gap-2 px-4">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                Requires Microphone & Camera Access
              </p>
            </div>
          </div>
        </div>

        {/* Technical Architecture Section */}
        <div className="w-full bg-gray-900/30 border-t border-gray-800">
           <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
              <div className="mb-8 sm:mb-12 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 bree-serif-regular">Model Architecture</h3>
                <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto md:mx-0">Evolution from research prototype to production-grade efficiency.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Prototype Card */}
                <div className="p-6 sm:p-8 rounded-2xl bg-gray-800/20 border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
                      {/* Brain/Neural Network Icon */}
                      <svg className="w-24 h-24 sm:w-32 sm:h-32" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a9 9 0 00-9 9c0 3.074 1.676 5.753 4.163 7.198A3.995 3.995 0 008 16a4 4 0 01-4-4c0-1.054.816-1.943 1.855-2.04A3.5 3.5 0 019.5 6.5c.423 0 .83.075 1.207.213A4.001 4.001 0 0116 4a4 4 0 013.293 6.96A3.5 3.5 0 0118 15.5a3.5 3.5 0 01-2.293-1.04A4.001 4.001 0 0112 18a4 4 0 01-3.707-2.5A3.993 3.993 0 018 16c.729 0 1.412-.195 2-.535V16a2 2 0 002 2 2 2 0 002-2v-.535c.588.34 1.271.535 2 .535a4 4 0 004-4c0-1.054-.816-1.943-1.855-2.04A3.5 3.5 0 0014.5 6.5c-.423 0-.83.075-1.207.213A3.993 3.993 0 0012 6V2z"/>
                      </svg>
                   </div>
                   <h4 className="text-base sm:text-lg font-semibold text-gray-300 mb-3 sm:mb-4 flex items-center gap-2 righteous-regular">
                      <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                      Early Prototype
                   </h4>
                   <p className="text-gray-400 text-sm leading-relaxed mb-3 sm:mb-4">
                     In our early prototype, we utilized the large vision-language model <strong className="text-gray-200">HuggingFace IDEFICS2-8B-Chatty</strong>.
                   </p>
                   <p className="text-gray-400 text-sm leading-relaxed">
                     While it produced strong outputs, the <span className="text-red-400/80">8B parameter size</span> resulted in high latency, making it unsuitable for real-time assistive guidance where every millisecond counts.
                   </p>
                </div>

                {/* Current Architecture Card */}
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-900/20 to-gray-900/40 border border-amber-500/20 relative overflow-hidden shadow-lg shadow-amber-900/10">
                   <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
                      {/* Chip/Processor Icon */}
                      <svg className="w-24 h-24 sm:w-32 sm:h-32 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 2v2H7v2H5v2H3v4h2v2h2v2h2v2h6v-2h2v-2h2v-2h2V8h-2V6h-2V4h-2V2H9zm0 4h6v2h2v2h2v4h-2v2h-2v2H9v-2H7v-2H5V8h2V6h2V6zm3 4a2 2 0 100 4 2 2 0 000-4z"/>
                      </svg>
                   </div>
                   <h4 className="text-base sm:text-lg font-semibold text-amber-400 mb-3 sm:mb-4 flex items-center gap-2 righteous-regular">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24]"></span>
                      Current Engine
                   </h4>
                   <p className="text-gray-300 text-sm leading-relaxed mb-3 sm:mb-4">
                     We shifted to a modular, high-efficiency setup designed for speed:
                   </p>
                   <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                     <li className="flex items-start gap-3">
                        <div className="mt-1 bg-amber-500/20 p-1.5 rounded text-amber-400">
                          {/* Eye/Vision Icon */}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div>
                          <strong className="text-white block text-sm">SmolVLM-256M</strong>
                          <span className="text-gray-400 text-xs">Vision-Language Encoder (~256M params). Extremely compact for instant scene captioning.</span>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <div className="mt-1 bg-yellow-500/20 p-1.5 rounded text-yellow-400">
                          {/* Chat/Language Icon */}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <strong className="text-white block text-sm">TinyLlama-1.1B-Chat</strong>
                          <span className="text-gray-400 text-xs">Language Model (~1.1B params). Capable conversational logic with minimal footprint.</span>
                        </div>
                     </li>
                   </ul>
                   <div className="pt-3 sm:pt-4 border-t border-white/5">
                      <p className="text-gray-400 text-xs italic leading-relaxed">
                        <span className="text-amber-400 font-semibold not-italic">Roadmap:</span> We are currently quantizing the original 8B IDEFICS2 model. Once optimized, it will return as a high-fidelity mode option.
                      </p>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Feature Grid */}
        <div className="w-full bg-gray-900/50 backdrop-blur-sm border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
            <h3 className="text-xl sm:text-2xl font-bold mb-8 sm:mb-12 text-center bree-serif-regular">Core Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <FeatureCard 
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9 7" />
                  </svg>
                }
                title="Spatial Navigation"
                description="Real-time obstacle detection and turn-by-turn guidance using advanced depth perception and scene memory."
              />
              <FeatureCard 
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
                title="Object Recognition"
                description="Identifies objects, people, and scenes instantly. Simply ask 'What's in front of me?' for a detailed description."
              />
              <FeatureCard 
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                title="Text & Document Reading"
                description="Reads signs, labels, menus, and documents aloud. Perfect for navigating new places or sorting items."
              />
            </div>
          </div>
        </div>

        {/* Footer / Safety */}
        <footer className="py-8 sm:py-12 px-4 sm:px-6 text-center border-t border-gray-800 text-gray-500 text-xs sm:text-sm">
           <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
             <div className="flex items-center justify-center space-x-2 text-amber-500/80 mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="font-semibold uppercase tracking-wider text-xs sm:text-sm">Safety Notice</span>
             </div>
             <p className="leading-relaxed">
               This system uses Artificial Intelligence to interpret video feeds. While highly advanced, it may occasionally provide inaccurate information.
               Always prioritize your safety and use a cane, guide dog, or human assistance in hazardous or unfamiliar environments.
             </p>
             <div className="pt-6 sm:pt-8">
               <p>Copyright 2025 LUMEX AI. All rights reserved.</p>
             </div>
           </div>
        </footer>
      </div>
    </main>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-gray-800/40 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 group">
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-amber-400 group-hover:text-white group-hover:bg-amber-600 transition-colors">
      {icon}
    </div>
    <h4 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-100 righteous-regular">{title}</h4>
    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
