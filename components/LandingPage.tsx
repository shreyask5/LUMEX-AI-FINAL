import React from 'react';

interface LandingPageProps {
  onInitialize: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onInitialize }) => {
  return (
    <main className="flex flex-col h-screen bg-gray-950 text-white overflow-y-auto overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-full">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-6 md:px-12">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-100">LUMEX AI</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-400">
            <span>v3.1.0-rc</span>
            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 text-xs uppercase tracking-wider">Edge Compute</span>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20 text-center max-w-5xl mx-auto w-full">
          <div className="animate-slide-up space-y-8">
            <div className="space-y-4">
              <h2 className="text-blue-400 font-semibold tracking-widest text-sm uppercase">Spatial Intelligence System</h2>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                See the world <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  in a new dimension.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                An advanced visual assistant for the visually impaired. Utilizing a modular multimodal architecture to perceive, interpret, and navigate complex environments in real-time.
              </p>
            </div>

            <div className="pt-8 pb-12">
              <button
                onClick={onInitialize}
                className="group relative inline-flex items-center justify-center px-8 py-5 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-2xl hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-gray-900 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="mr-3">Initialize System</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <p className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                Requires Microphone & Camera Access
              </p>
            </div>
          </div>
        </div>

        {/* Technical Architecture Section */}
        <div className="w-full bg-gray-900/30 border-t border-gray-800">
           <div className="max-w-6xl mx-auto px-6 py-20">
              <div className="mb-12 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Model Architecture</h3>
                <p className="text-gray-400 max-w-2xl">Evolution from research prototype to production-grade efficiency.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Prototype Card */}
                <div className="p-8 rounded-2xl bg-gray-800/20 border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                   </div>
                   <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                      Early Prototype
                   </h4>
                   <p className="text-gray-400 text-sm leading-relaxed mb-4">
                     In our early prototype, we utilized the large vision-language model <strong className="text-gray-200">HuggingFace IDEFICS2-8B-Chatty</strong>.
                   </p>
                   <p className="text-gray-400 text-sm leading-relaxed">
                     While it produced strong outputs, the <span className="text-amber-400/80">8B parameter size</span> resulted in high latency, making it unsuitable for real-time assistive guidance where every millisecond counts.
                   </p>
                </div>

                {/* Current Architecture Card */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-900/20 to-gray-900/40 border border-blue-500/20 relative overflow-hidden shadow-lg shadow-blue-900/10">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <svg className="w-32 h-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                   </div>
                   <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60A5FA]"></span>
                      Current Engine
                   </h4>
                   <p className="text-gray-300 text-sm leading-relaxed mb-4">
                     We shifted to a modular, high-efficiency setup designed for speed:
                   </p>
                   <ul className="space-y-3 mb-6">
                     <li className="flex items-start gap-3">
                        <div className="mt-1 bg-blue-500/20 p-1 rounded text-blue-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </div>
                        <div>
                          <strong className="text-white block text-sm">SmolVLM-256M</strong>
                          <span className="text-gray-400 text-xs">Vision-Language Encoder (~256M params). Extremely compact for instant scene captioning.</span>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <div className="mt-1 bg-indigo-500/20 p-1 rounded text-indigo-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <div>
                          <strong className="text-white block text-sm">TinyLlama-1.1B-Chat</strong>
                          <span className="text-gray-400 text-xs">Language Model (~1.1B params). Capable conversational logic with minimal footprint.</span>
                        </div>
                     </li>
                   </ul>
                   <div className="pt-4 border-t border-white/5">
                      <p className="text-gray-400 text-xs italic">
                        <span className="text-blue-400 font-semibold not-italic">Roadmap:</span> We are currently quantifying the original 8B IDEFICS2 model. Once optimized, it will return as a high-fidelity mode option.
                      </p>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Feature Grid */}
        <div className="w-full bg-gray-900/50 backdrop-blur-sm border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <h3 className="text-2xl font-bold mb-12 text-center">Core Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9 7" /></svg>}
                title="Spatial Navigation"
                description="Real-time obstacle detection and turn-by-turn guidance using advanced depth perception and scene memory."
              />
              <FeatureCard 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                title="Object Recognition"
                description="Identifies objects, people, and scenes instantly. Simply ask 'What's in front of me?' for a detailed description."
              />
              <FeatureCard 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                title="Text & Document Reading"
                description="Reads signs, labels, menus, and documents aloud. Perfect for navigating new places or sorting items."
              />
            </div>
          </div>
        </div>

        {/* Footer / Safety */}
        <footer className="py-12 px-6 text-center border-t border-gray-800 text-gray-500 text-sm">
           <div className="max-w-2xl mx-auto space-y-4">
             <div className="flex items-center justify-center space-x-2 text-amber-500/80 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="font-semibold uppercase tracking-wider">Safety Notice</span>
             </div>
             <p>
               This system uses Artificial Intelligence to interpret video feeds. While highly advanced, it may occasionally provide inaccurate information. 
               Always prioritize your safety and use a cane, guide dog, or human assistance in hazardous or unfamiliar environments.
             </p>
             <div className="pt-8">
               <p>Copyright 2025 LUMEX AI. All rights reserved.</p>
             </div>
           </div>
        </footer>
      </div>
    </main>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-gray-800/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 group">
    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-6 text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-colors">
      {icon}
    </div>
    <h4 className="text-xl font-bold mb-3 text-gray-100">{title}</h4>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;