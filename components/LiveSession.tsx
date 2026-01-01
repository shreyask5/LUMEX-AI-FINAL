import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
import { createAudioBlob, blobToBase64, decodeAudioData, base64ToArrayBuffer } from '../utils/audio';

interface LiveSessionProps {
  onEndSession: () => void;
}

interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isComplete: boolean;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onEndSession }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCcOpen, setIsCcOpen] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  
  // Media Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputProcessorRef = useRef<AudioWorkletNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // API Refs
  const sessionRef = useRef<Promise<any> | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Constants
  const INPUT_SAMPLE_RATE = 16000;
  const OUTPUT_SAMPLE_RATE = 24000;
  const FPS = 2;

  // Auto-scroll transcript (both desktop and mobile)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTop = mobileScrollRef.current.scrollHeight;
    }
  }, [transcripts, isCcOpen]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
          throw new Error("API Key not found in environment. Please set VITE_API_KEY in your .env file.");
        }

        // 1. Get Media Stream (Audio + Video)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: INPUT_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true,
          },
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment'
          }
        });
        
        if (!isMounted) return;
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 2. Initialize Audio Contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: INPUT_SAMPLE_RATE,
        });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: OUTPUT_SAMPLE_RATE,
        });

        // 3. Connect to API
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
        
        const sessionPromise = ai.live.connect({
          model: MODEL_NAME,
          config: {
            tools: [{ googleSearch: {} }],
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: SYSTEM_INSTRUCTION,
            inputAudioTranscription: {}, 
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              console.log("Live Session Opened");
              isConnectedRef.current = true;
              if (isMounted) setStatus('connected');
            },
            onmessage: async (message: LiveServerMessage) => {
              // Handle Audio Output
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                try {
                  const ctx = outputAudioContextRef.current;
                  const audioData = base64ToArrayBuffer(base64Audio);
                  const audioBuffer = await decodeAudioData(audioData, ctx, OUTPUT_SAMPLE_RATE);
                  
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  
                  source.onended = () => {
                    audioSourcesRef.current.delete(source);
                  };
                  
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  audioSourcesRef.current.add(source);
                } catch (err) {
                  console.error("Error decoding/playing audio:", err);
                }
              }

              // Handle Interruption
              if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(source => {
                    try { source.stop(); } catch(e) {}
                });
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              // Handle Transcription
              if (isMounted) {
                const inputTx = message.serverContent?.inputTranscription?.text;
                const outputTx = message.serverContent?.outputTranscription?.text;

                if (inputTx || outputTx) {
                  setTranscripts(prev => {
                    const newTranscripts = [...prev];
                    const text = inputTx || outputTx;
                    const role = inputTx ? 'user' : 'assistant';
                    
                    const lastMsg = newTranscripts[newTranscripts.length - 1];
                    
                    if (lastMsg && lastMsg.role === role) {
                      // Immutable update to prevent issues
                      newTranscripts[newTranscripts.length - 1] = {
                        ...lastMsg,
                        text: lastMsg.text + text
                      };
                      return newTranscripts;
                    } else {
                      return [...newTranscripts, {
                        id: Date.now().toString(),
                        role,
                        text: text || '',
                        isComplete: false
                      }];
                    }
                  });
                }
              }
            },
            onclose: () => {
              console.log("Live Session Closed");
              isConnectedRef.current = false;
              if (isMounted) onEndSession();
            },
            onerror: (err) => {
              console.error("Live API Error:", err);
              isConnectedRef.current = false;
              if (isMounted) {
                setStatus('error');
                setErrorMsg("Connection error occurred. Please restart.");
              }
            }
          }
        });

        sessionRef.current = sessionPromise;

        // 4. Setup Audio Input Streaming with AudioWorklet
        const source = inputAudioContextRef.current.createMediaStreamSource(stream);

        // Load the AudioWorklet module
        await inputAudioContextRef.current.audioWorklet.addModule('/audio-processor.js');

        // Create AudioWorkletNode
        const processor = new AudioWorkletNode(inputAudioContextRef.current, 'audio-input-processor');
        inputProcessorRef.current = processor;

        // Handle messages from the AudioWorklet
        processor.port.onmessage = (event) => {
          if (isMuted || !isConnectedRef.current) return;

          const inputData = event.data.audioData;
          const pcmBlob = createAudioBlob(inputData, INPUT_SAMPLE_RATE);

          sessionPromise.then(session => {
             if (isConnectedRef.current) {
               try {
                 session.sendRealtimeInput({ media: pcmBlob });
               } catch (e) {
                 console.error("Error sending audio:", e);
               }
             }
          });
        };

        source.connect(processor);
        processor.connect(inputAudioContextRef.current.destination);

        // 5. Setup Video Frame Streaming
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas?.getContext('2d');

        if (canvas && video && ctx) {
          frameIntervalRef.current = window.setInterval(async () => {
            if (video.readyState === 4 && isConnectedRef.current) {
              canvas.width = video.videoWidth * 0.5;
              canvas.height = video.videoHeight * 0.5;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const base64Data = await new Promise<string>(resolve => {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5); 
                resolve(dataUrl.split(',')[1]);
              });

              sessionPromise.then(session => {
                if (isConnectedRef.current) {
                  try {
                    session.sendRealtimeInput({
                      media: {
                        mimeType: 'image/jpeg',
                        data: base64Data
                      }
                    });
                  } catch (e) {
                    console.error("Error sending video:", e);
                  }
                }
              });
            }
          }, 1000 / FPS);
        }

      } catch (err: any) {
        console.error("Initialization error:", err);
        setStatus('error');
        setErrorMsg(err.message || "Failed to initialize.");
      }
    };

    initialize();

    return () => {
      isMounted = false;
      isConnectedRef.current = false;
      
      // Cleanup Session
      if (sessionRef.current) {
        sessionRef.current.then(session => {
          try {
            session.close();
          } catch(e) {
            console.error("Error closing session:", e);
          }
        });
      }

      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (inputProcessorRef.current) {
        inputProcessorRef.current.disconnect();
        inputProcessorRef.current = null;
      }
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onEndSession, isMuted]);

// Automatic Environment Description (Every 30 seconds)
  useEffect(() => {
    let intervalId: any;

    // Only start the interval when the session is actually connected
    if (status === 'connected') {
      intervalId = setInterval(() => {
        if (isConnectedRef.current && sessionRef.current) {

          // 1. Capture the current video frame explicitly
          let imageBase64: string | null = null;
          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Check if video is ready
            if (video.readyState === 4 && ctx) {
               // Draw video to canvas (using same 0.5 scale as stream for performance)
               canvas.width = video.videoWidth * 0.5;
               canvas.height = video.videoHeight * 0.5;
               ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

               // Convert to base64
               const dataURL = canvas.toDataURL('image/jpeg', 0.5);
               imageBase64 = dataURL.split(',')[1];
            }
          }

          sessionRef.current.then((session) => {
            const prompt = "Briefly describe the surrounding environment in short.";
            try {
              if (typeof session.sendClientContent === 'function') {
                const parts: any[] = [{ text: prompt }];

                // 2. Attach the image to the prompt parts
                if (imageBase64) {
                    parts.push({
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBase64
                        }
                    });
                }

                session.sendClientContent({
                    turns: [{ role: 'user', parts: parts }],
                    turnComplete: true
                });
              } else {
                console.warn("session.sendClientContent is not a function.");
              }

              setTranscripts(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                text: prompt,
                isComplete: true
              }]);

            } catch (e) {
              console.error("Error sending auto-prompt:", e);
            }
          });
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleCc = () => {
    setIsCcOpen(!isCcOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden font-sans relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Righteous&family=Bree+Serif&display=swap');

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

        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>

      {/* Hidden Canvas for API Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="flex-none p-4 z-10 flex justify-between items-center bg-gradient-to-b from-gray-900 to-transparent">
          <div className="flex items-center space-x-3 bg-gray-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/50 shadow-lg">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500'}`} />
            <span className="font-bold text-xs tracking-widest uppercase text-gray-200">
              {status === 'connecting' ? 'INITIALIZING' : status === 'connected' ? 'SYSTEM ACTIVE' : 'OFFLINE'}
            </span>
          </div>
          
           <button 
            onClick={onEndSession}
            className="bg-gray-900/60 backdrop-blur text-gray-400 hover:text-white p-2.5 rounded-full border border-gray-700/50 hover:bg-gray-800 transition-all shadow-lg"
            aria-label="Exit Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
          </button>
      </header>

      {/* Main Viewport - Flex Row for Side-by-Side Layout */}
      <div className="flex-1 relative flex min-h-0 px-4 gap-4 pt-2">

         {/* CC Panel - Desktop only (hidden on mobile) */}
         <div className={`hidden md:flex flex-col bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCcOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4 border-0'}`}>
             {/* Fixed width inner container to prevent text reflow during width transition */}
             <div className="w-80 h-full flex flex-col">
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                   <h3 className="font-bold text-sm tracking-wider uppercase text-amber-400 righteous-regular">Live Transcript</h3>
                   <button onClick={toggleCc} className="text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                   {transcripts.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                         <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                         </div>
                         <p className="text-xs italic">Listening...</p>
                      </div>
                   )}
                   {transcripts.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                         <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                            {msg.role === 'user' ? 'You' : 'Lumex'}
                         </span>
                         <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[90%] leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                            : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm'
                         }`}>
                            {msg.text}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
         </div>

         {/* Video Feed Container - flex-1 allows shrinking */}
         <div className="relative flex-1 rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-gray-800/50 ring-1 ring-white/5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] min-w-0">
             
             <video 
               ref={videoRef} 
               className={`w-full h-full object-cover transition-opacity duration-1000 ${status === 'connected' ? 'opacity-100' : 'opacity-0'}`}
               playsInline 
               muted 
               autoPlay 
             />

             {/* Loading State */}
             {status !== 'connected' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                   <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                   <div className="text-gray-400 text-sm font-medium tracking-wide animate-pulse righteous-regular">ESTABLISHING FEED...</div>
                </div>
             )}

             {/* HUD Overlay */}
             {status === 'connected' && (
               <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning Laser Effect */}
                  <div className="absolute left-0 right-0 h-0.5 bg-blue-400/30 shadow-[0_0_20px_rgba(96,165,250,0.6)] animate-scan z-10" />
                  
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

                  {/* Top HUD Info */}
                  <div className="absolute top-0 right-0 p-6 flex flex-col items-end space-y-1">
                     <span className="text-[10px] text-gray-400 font-mono">RES: 640x480</span>
                     <span className="text-[10px] text-gray-400 font-mono">FPS: {FPS}</span>
                     <span className="text-[10px] text-blue-400 font-mono">LATENCY: LOW</span>
                  </div>

                  {/* Bottom Control/Info Panel - Desktop: always shown, Mobile: hidden when CC is open */}
                  <div className={`absolute bottom-0 left-0 right-0 p-6 space-y-4 transition-opacity duration-300 ${isCcOpen ? 'md:opacity-100 opacity-0 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}>
                     <div className="flex items-end justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="animate-pulse w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase righteous-regular">Visual Assistant</p>
                          </div>
                          <p className="text-white/95 text-lg font-light leading-snug max-w-[85%] bree-serif-regular">
                             Analyzing environment for spatial guidance...
                          </p>
                        </div>
                     </div>
                  </div>

                  {/* Mobile-only Transcript Overlay - Shows at bottom when CC is open */}
                  <div className={`md:hidden absolute bottom-0 left-0 right-0 transition-all duration-500 z-20 ${isCcOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                     <div className="bg-gray-900/10 backdrop-blur-sm border-t border-white/20 rounded-t-3xl shadow-2xl max-h-[32vh] flex flex-col pointer-events-auto">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                           <h3 className="font-bold text-xs tracking-wider uppercase text-amber-400 righteous-regular">Live Transcript</h3>
                           <button onClick={toggleCc} className="text-gray-400 hover:text-white transition-colors p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                           </button>
                        </div>
                        <div ref={mobileScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-[120px] max-h-[calc(32vh-60px)]">
                           {transcripts.length === 0 && (
                              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                 </div>
                                 <p className="text-xs italic">Listening...</p>
                              </div>
                           )}
                           {transcripts.map((msg, idx) => (
                              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                                 <span className="text-[9px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                                    {msg.role === 'user' ? 'You' : 'Lumex'}
                                 </span>
                                 <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-sm ${
                                    msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm'
                                 }`}>
                                    {msg.text}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
             )}
         </div>

         {/* Error Modal */}
         {status === 'error' && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
              <div className="bg-gray-900 border border-red-500/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl ring-1 ring-red-500/20">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 bree-serif-regular">System Error</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">{errorMsg}</p>
                <button 
                  onClick={onEndSession}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold tracking-wide transition-colors shadow-lg shadow-red-900/20 righteous-regular"
                >
                  RESTART SYSTEM
                </button>
              </div>
           </div>
         )}
      </div>

      {/* Controls */}
      <div className="flex-none px-6 pb-8 pt-6">
         <div className="flex items-center justify-center gap-3">
             <button
              onClick={toggleMute}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 shadow-lg backdrop-blur-md ring-1 righteous-regular ${
                isMuted 
                ? 'bg-red-500 text-white ring-red-400 hover:bg-red-600 hover:ring-red-500' 
                : 'bg-gray-800/80 text-gray-200 ring-gray-700 hover:bg-gray-700 hover:ring-gray-600 hover:text-white'
              }`}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 18 18"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/><path d="M8 23h8"/></svg>
              )}
              <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
            </button>
            
            <button
              onClick={toggleCc}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 shadow-lg backdrop-blur-md ring-1 righteous-regular ${
                isCcOpen
                ? 'bg-amber-600 text-white ring-amber-500 hover:bg-amber-500'
                : 'bg-gray-800/80 text-gray-200 ring-gray-700 hover:bg-gray-700 hover:ring-gray-600 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <span>CC</span>
            </button>

            <button
              onClick={onEndSession}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm tracking-wide bg-black/40 text-red-400 ring-1 ring-red-500/30 hover:bg-red-950/50 hover:ring-red-500/60 hover:text-red-300 transition-all duration-300 shadow-lg backdrop-blur-md righteous-regular"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>
               <span>STOP</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default LiveSession;