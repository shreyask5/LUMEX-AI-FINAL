import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
import { createAudioBlob, blobToBase64, decodeAudioData, base64ToArrayBuffer } from '../utils/audio';
import AudioVisualizer from './AudioVisualizer';

interface LiveSessionProps {
  onEndSession: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onEndSession }) => {
  console.log('[LiveSession] Component rendered');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  
  // Media Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // API Refs
  const sessionRef = useRef<any>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const isEndingManuallyRef = useRef<boolean>(false);
  const onEndSessionRef = useRef(onEndSession);
  const sessionOpenedRef = useRef<boolean>(false);

  // Constants
  const INPUT_SAMPLE_RATE = 16000;
  const OUTPUT_SAMPLE_RATE = 24000;
  const FPS = 2;

  // Track status changes
  useEffect(() => {
    console.log('[LiveSession] 📊 Status changed to:', status);
  }, [status]);

  // Keep onEndSession ref up to date
  useEffect(() => {
    console.log('[LiveSession] onEndSession ref updated');
    onEndSessionRef.current = onEndSession;
  }, [onEndSession]);

  useEffect(() => {
    console.log('[LiveSession] useEffect triggered - isMuted:', isMuted);
    let isMounted = true;
    isEndingManuallyRef.current = false;
    sessionOpenedRef.current = false;

    const initialize = async () => {
      console.log('[LiveSession] Initialization started');
      try {
        console.log('[LiveSession] Checking API key...');
        let apiKey = import.meta.env.VITE_API_KEY;
        
        // Log key info (safely - only first/last chars)
        if (apiKey) {
          const trimmed = apiKey.trim();
          console.log('[LiveSession] API key present:', true, 'Length:', apiKey.length);
          console.log('[LiveSession] API key starts with:', apiKey.substring(0, 10) + '...');
          console.log('[LiveSession] API key ends with:', '...' + apiKey.substring(apiKey.length - 10));
          
          // Check for common issues
          if (apiKey !== trimmed) {
            console.warn('[LiveSession] ⚠️ API key has whitespace - trimming');
            apiKey = trimmed;
          }
          if (apiKey.startsWith('"') || apiKey.startsWith("'")) {
            console.warn('[LiveSession] ⚠️ API key starts with quote - removing');
            apiKey = apiKey.replace(/^["']/, '');
          }
          if (apiKey.endsWith('"') || apiKey.endsWith("'")) {
            console.warn('[LiveSession] ⚠️ API key ends with quote - removing');
            apiKey = apiKey.replace(/["']$/, '');
          }
          
          // Use trimmed/cleaned key
          if (apiKey !== import.meta.env.VITE_API_KEY) {
            console.log('[LiveSession] Using cleaned API key, new length:', apiKey.length);
          }
        } else {
          console.log('[LiveSession] API key present: false');
        }
        
        if (!apiKey || apiKey.length === 0) {
          throw new Error("API Key not found in environment. Please set VITE_API_KEY in your .env file.");
        }

        // 1. Get Media Stream (Audio + Video)
        console.log('[LiveSession] Requesting media stream...');
        
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const errorMsg = navigator.mediaDevices 
            ? 'getUserMedia is not supported in this browser'
            : 'MediaDevices API is not available. Please use HTTPS or localhost.';
          console.error('[LiveSession] 🚨 MediaDevices error:', errorMsg);
          throw new Error(errorMsg);
        }
        
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
        console.log('[LiveSession] Media stream acquired:', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
          isMounted
        });
        
        if (!isMounted) {
          console.log('[LiveSession] Component unmounted during initialization, aborting');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          console.log('[LiveSession] Setting video source and playing...');
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log('[LiveSession] Video playing');
        }

        // 2. Initialize Audio Contexts
        console.log('[LiveSession] Creating audio contexts...');
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: INPUT_SAMPLE_RATE,
        });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: OUTPUT_SAMPLE_RATE,
        });
        console.log('[LiveSession] Audio contexts created:', {
          inputState: inputAudioContextRef.current.state,
          outputState: outputAudioContextRef.current.state
        });

        // 3. Connect to API
        console.log('[LiveSession] Creating GoogleGenAI instance...');
        // Use cleaned API key
        const apiKeyToUse = apiKey.trim().replace(/^["']|["']$/g, '');
        console.log('[LiveSession] API key being used:', {
          length: apiKeyToUse.length,
          startsWith: apiKeyToUse.substring(0, 15) + '...',
          endsWith: '...' + apiKeyToUse.substring(apiKeyToUse.length - 15),
          hasQuotes: apiKeyToUse.includes('"') || apiKeyToUse.includes("'"),
          hasWhitespace: apiKeyToUse !== apiKeyToUse.trim(),
          rawValue: `"${apiKeyToUse.substring(0, 10)}...${apiKeyToUse.substring(apiKeyToUse.length - 10)}"`
        });
        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        console.log('[LiveSession] Connecting to live API with model:', MODEL_NAME);
        
        const sessionPromise = ai.live.connect({
          model: MODEL_NAME,
          config: {
            responseModalities: [Modality.AUDIO], // Only AUDIO, not AUDIO + TEXT
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: SYSTEM_INSTRUCTION,
          },
          callbacks: {
            onopen: () => {
              console.log('[LiveSession] ✅ onopen callback fired - Session opened successfully');
              console.log('[LiveSession] onopen - isMounted:', isMounted, 'sessionOpenedRef:', sessionOpenedRef.current);
              sessionOpenedRef.current = true;
              if (isMounted) {
                console.log('[LiveSession] Setting status to connected');
                setStatus('connected');
                // Add a small delay before starting to send data to ensure session is fully ready
                console.log('[LiveSession] Waiting 200ms before sending data...');
                setTimeout(() => {
                  console.log('[LiveSession] Ready to send data');
                }, 200);
              } else {
                console.log('[LiveSession] ⚠️ Component unmounted, not updating status');
              }
            },
            onmessage: async (message: LiveServerMessage) => {
              console.log('[LiveSession] 📨 onmessage received:', {
                hasModelTurn: !!message.serverContent?.modelTurn,
                hasParts: !!message.serverContent?.modelTurn?.parts,
                interrupted: message.serverContent?.interrupted
              });
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

              if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(source => {
                    try { source.stop(); } catch(e) {}
                });
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: (event?: any) => {
              console.log('[LiveSession] ❌ onclose callback fired');
              console.log('[LiveSession] onclose - isMounted:', isMounted, 'isEndingManually:', isEndingManuallyRef.current, 'sessionOpened:', sessionOpenedRef.current);
              console.log('[LiveSession] onclose event details:', {
                event,
                code: event?.code,
                reason: event?.reason,
                wasClean: event?.wasClean,
                type: typeof event,
                keys: event ? Object.keys(event) : []
              });
              
              if (!isMounted) {
                console.log('[LiveSession] Component unmounted, ignoring onclose');
                return;
              }
              
              if (isEndingManuallyRef.current) {
                console.log('[LiveSession] Session ending manually, ignoring onclose');
                return;
              }
              
              // If session closed before opening, show error instead of ending
              if (!sessionOpenedRef.current) {
                console.log('[LiveSession] ⚠️ Session closed before opening - showing error');
                setStatus('error');
                const closeReason = event?.reason || event?.code || 'Unknown reason';
                setErrorMsg(`Failed to establish connection: ${closeReason}. Please check your API key and try again.`);
              } else {
                console.log('[LiveSession] Session was opened and then closed');
                // Add a small delay to see if it's a temporary connection issue
                // and to allow any error messages to come through
                setTimeout(() => {
                  if (isMounted && !isEndingManuallyRef.current) {
                    console.log('[LiveSession] Calling onEndSession after delay');
                    onEndSessionRef.current();
                  }
                }, 500);
              }
            },
            onerror: (err) => {
              console.error('[LiveSession] 🚨 onerror callback fired:', err);
              console.log('[LiveSession] onerror - isMounted:', isMounted, 'sessionOpened:', sessionOpenedRef.current);
              if (isMounted) {
                setStatus('error');
                setErrorMsg("Connection error occurred. Please restart.");
              }
            }
          }
        });

        sessionRef.current = sessionPromise;
        console.log('[LiveSession] Session promise created and stored');
        
        // Handle session promise rejection
        sessionPromise.catch((err) => {
          console.error('[LiveSession] 🚨 Session promise rejected:', err);
          console.log('[LiveSession] Promise rejection - isMounted:', isMounted);
          if (isMounted) {
            setStatus('error');
            setErrorMsg(err.message || "Failed to connect to API. Please check your API key.");
          }
        });
        
        // Also log when promise resolves
        sessionPromise.then((session) => {
          console.log('[LiveSession] ✅ Session promise resolved, session object:', {
            hasClose: typeof session?.close === 'function',
            hasSendRealtimeInput: typeof session?.sendRealtimeInput === 'function'
          });
        }).catch((err) => {
          console.error('[LiveSession] 🚨 Session promise error in then handler:', err);
        });

        // 4. Setup Audio Input Streaming
        console.log('[LiveSession] Setting up audio input streaming...');
        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
        const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
        inputProcessorRef.current = processor;
        console.log('[LiveSession] Audio processor created');

        let audioSendCount = 0;
        let sessionReadyTime = 0;
        processor.onaudioprocess = (e) => {
          if (isMuted || isEndingManuallyRef.current) return;
          
          // Only send audio if session is opened
          if (!sessionOpenedRef.current) {
            if (audioSendCount === 0) {
              console.log('[LiveSession] ⚠️ Audio data ready but session not opened yet, skipping');
            }
            return;
          }
          
          // Wait at least 200ms after session opens before sending first data
          if (sessionReadyTime === 0) {
            sessionReadyTime = Date.now();
          }
          if (Date.now() - sessionReadyTime < 200) {
            return; // Skip first few audio chunks to let session stabilize
          }
          
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createAudioBlob(inputData, INPUT_SAMPLE_RATE);
          
          sessionPromise.then(session => {
            if (!isEndingManuallyRef.current && session && sessionOpenedRef.current) {
              try {
                audioSendCount++;
                if (audioSendCount <= 3 || audioSendCount % 100 === 0) {
                  console.log('[LiveSession] 🎤 Sending audio data, count:', audioSendCount);
                }
                session.sendRealtimeInput({ media: pcmBlob });
              } catch (err) {
                console.error('[LiveSession] Error sending audio:', err);
              }
            }
          }).catch(() => {
            // Session promise rejected, ignore
          });
        };

        source.connect(processor);
        processor.connect(inputAudioContextRef.current.destination);

        // 5. Setup Video Frame Streaming
        console.log('[LiveSession] Setting up video frame streaming...');
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas?.getContext('2d');
        console.log('[LiveSession] Video setup:', {
          hasCanvas: !!canvas,
          hasVideo: !!video,
          hasContext: !!ctx
        });

        if (canvas && video && ctx) {
          console.log('[LiveSession] Starting video frame interval');
          let videoSendCount = 0;
          let videoReadyTime = 0;
          frameIntervalRef.current = window.setInterval(async () => {
            if (isEndingManuallyRef.current) return;
            
            // Only send video if session is opened
            if (!sessionOpenedRef.current) {
              if (videoSendCount === 0) {
                console.log('[LiveSession] ⚠️ Video frame ready but session not opened yet, skipping');
              }
              return;
            }
            
            // Wait at least 200ms after session opens before sending first video frame
            if (videoReadyTime === 0) {
              videoReadyTime = Date.now();
            }
            if (Date.now() - videoReadyTime < 200) {
              return; // Skip first video frame to let session stabilize
            }
            
            if (video.readyState === 4) {
              canvas.width = video.videoWidth * 0.5;
              canvas.height = video.videoHeight * 0.5;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const base64Data = await new Promise<string>(resolve => {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5); 
                resolve(dataUrl.split(',')[1]);
              });

              sessionPromise.then(session => {
                if (!isEndingManuallyRef.current && session && sessionOpenedRef.current) {
                  try {
                    videoSendCount++;
                    if (videoSendCount <= 3 || videoSendCount % 10 === 0) {
                      console.log('[LiveSession] 📹 Sending video frame, count:', videoSendCount);
                    }
                    session.sendRealtimeInput({
                      media: {
                        mimeType: 'image/jpeg',
                        data: base64Data
                      }
                    });
                  } catch (err) {
                    console.error('[LiveSession] Error sending video:', err);
                  }
                }
              }).catch(() => {
                // Session promise rejected, ignore
              });
            }
          }, 1000 / FPS);
          console.log('[LiveSession] Video frame interval started');
        } else {
          console.warn('[LiveSession] ⚠️ Cannot setup video frame streaming - missing canvas/video/context');
        }

        console.log('[LiveSession] ✅ Initialization completed successfully');

      } catch (err: any) {
        console.error('[LiveSession] 🚨 Initialization error:', err);
        console.log('[LiveSession] Error details:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
          isMounted,
          hasNavigator: typeof navigator !== 'undefined',
          hasMediaDevices: typeof navigator?.mediaDevices !== 'undefined',
          protocol: typeof window !== 'undefined' ? window.location?.protocol : 'unknown',
          hostname: typeof window !== 'undefined' ? window.location?.hostname : 'unknown'
        });
        if (isMounted) {
          setStatus('error');
          let errorMessage = err.message || "Failed to initialize.";
          
          // Provide helpful error messages for common issues
          if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
            if (typeof window !== 'undefined' && window.location?.protocol === 'http:' && window.location?.hostname !== 'localhost' && window.location?.hostname !== '127.0.0.1') {
              errorMessage = "Media access requires HTTPS or localhost. Please use HTTPS or access via localhost.";
            } else if (!navigator?.mediaDevices) {
              errorMessage = "Your browser doesn't support media access. Please use a modern browser.";
            } else {
              errorMessage = "Unable to access camera/microphone. Please check permissions and try again.";
            }
          }
          
          setErrorMsg(errorMessage);
        }
      }
    };

    console.log('[LiveSession] Starting initialization...');
    initialize();

    return () => {
      console.log('[LiveSession] 🧹 Cleanup function called');
      console.log('[LiveSession] Cleanup - isEndingManually:', isEndingManuallyRef.current, 'sessionOpened:', sessionOpenedRef.current);
      isMounted = false;
      
      if (frameIntervalRef.current) {
        console.log('[LiveSession] Clearing frame interval');
        clearInterval(frameIntervalRef.current);
      }
      
      if (inputProcessorRef.current) {
        console.log('[LiveSession] Disconnecting audio processor');
        inputProcessorRef.current.disconnect();
        inputProcessorRef.current = null;
      }
      
      if (inputAudioContextRef.current) {
        console.log('[LiveSession] Closing input audio context');
        try { inputAudioContextRef.current.close(); } catch(e) {
          console.error('[LiveSession] Error closing input audio context:', e);
        }
      }
      
      if (outputAudioContextRef.current) {
        console.log('[LiveSession] Closing output audio context');
        try { outputAudioContextRef.current.close(); } catch(e) {
          console.error('[LiveSession] Error closing output audio context:', e);
        }
      }
      
      if (mediaStreamRef.current) {
        console.log('[LiveSession] Stopping media stream tracks');
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close session if it exists and wasn't already closed manually
      if (sessionRef.current && !isEndingManuallyRef.current) {
        console.log('[LiveSession] Closing session from cleanup');
        sessionRef.current.then((session: any) => {
          if (session && typeof session.close === 'function') {
            console.log('[LiveSession] Calling session.close()');
            try {
              const closeResult = session.close();
              // Check if close() returns a promise
              if (closeResult && typeof closeResult.catch === 'function') {
                closeResult.catch((err: any) => {
                  console.error('[LiveSession] Error closing session:', err);
                });
              }
            } catch (err: any) {
              console.error('[LiveSession] Error calling session.close():', err);
            }
          } else {
            console.log('[LiveSession] Session object missing or no close method:', {
              hasSession: !!session,
              hasClose: session && typeof session.close === 'function'
            });
          }
        }).catch((err: any) => {
          console.error('[LiveSession] Session promise error in cleanup:', err);
        });
      } else {
        console.log('[LiveSession] Skipping session close - already manually ended or no session');
      }
      
      console.log('[LiveSession] Cleanup completed');
    };
  }, [isMuted]); // Removed onEndSession from dependencies - using ref instead

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleEndSession = async () => {
    console.log('[LiveSession] 🛑 handleEndSession called');
    isEndingManuallyRef.current = true;
    console.log('[LiveSession] handleEndSession - sessionOpened:', sessionOpenedRef.current);
    
    // Stop all audio sources first
    console.log('[LiveSession] Stopping audio sources:', audioSourcesRef.current.size);
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {
        console.error('[LiveSession] Error stopping audio source:', e);
      }
    });
    audioSourcesRef.current.clear();
    
    // Stop video frame streaming BEFORE closing session
    if (frameIntervalRef.current) {
      console.log('[LiveSession] Clearing frame interval');
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    // Disconnect audio processor BEFORE closing session
    if (inputProcessorRef.current) {
      console.log('[LiveSession] Disconnecting audio processor');
      try {
        inputProcessorRef.current.disconnect();
        inputProcessorRef.current = null;
      } catch(e) {
        console.error('[LiveSession] Error disconnecting processor:', e);
      }
    }
    
    // Close session if it exists
    if (sessionRef.current) {
      console.log('[LiveSession] Closing session...');
      try {
        const session = await sessionRef.current;
        console.log('[LiveSession] Session resolved, closing...');
        if (session && typeof session.close === 'function') {
          await session.close();
          console.log('[LiveSession] Session closed successfully');
        } else {
          console.warn('[LiveSession] Session object missing or no close method');
        }
      } catch (err) {
        console.error('[LiveSession] Error closing session:', err);
      }
      sessionRef.current = null;
    } else {
      console.log('[LiveSession] No session to close');
    }
    
    // Clean up media streams
    if (mediaStreamRef.current) {
      console.log('[LiveSession] Stopping media stream tracks');
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio contexts
    if (inputAudioContextRef.current) {
      console.log('[LiveSession] Closing input audio context');
      try { 
        inputAudioContextRef.current.close(); 
        inputAudioContextRef.current = null;
      } catch(e) {
        console.error('[LiveSession] Error closing input context:', e);
      }
    }
    if (outputAudioContextRef.current) {
      console.log('[LiveSession] Closing output audio context');
      try { 
        outputAudioContextRef.current.close(); 
        outputAudioContextRef.current = null;
      } catch(e) {
        console.error('[LiveSession] Error closing output context:', e);
      }
    }
    
    // Call the parent callback
    console.log('[LiveSession] Calling onEndSession callback');
    onEndSession();
    console.log('[LiveSession] handleEndSession completed');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden font-sans">
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
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
            onClick={handleEndSession}
            className="bg-gray-900/60 backdrop-blur text-gray-400 hover:text-white p-2.5 rounded-full border border-gray-700/50 hover:bg-gray-800 transition-all shadow-lg"
            aria-label="Exit Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
          </button>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 relative flex flex-col min-h-0 px-4">
         {/* Video Feed Container */}
         <div className="relative flex-1 rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-gray-800/50 ring-1 ring-white/5">
             
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
                   <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                   <div className="text-gray-400 text-sm font-medium tracking-wide animate-pulse">ESTABLISHING FEED...</div>
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

                  {/* Bottom Control/Info Panel */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
                     <div className="flex items-end justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="animate-pulse w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <p className="text-blue-400 text-xs font-bold tracking-[0.2em] uppercase">Visual Assistant</p>
                          </div>
                          <p className="text-white/95 text-lg font-light leading-snug max-w-[85%]">
                             Analyzing environment for spatial guidance...
                          </p>
                        </div>
                     </div>

                     {/* Audio Visualizer */}
                     <div className="h-16 w-full bg-black/20 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden p-2 ring-1 ring-white/10">
                        <AudioVisualizer stream={mediaStreamRef.current} isActive={!isMuted} color="#60A5FA" className="w-full h-full" />
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
                <h3 className="text-xl font-bold text-white mb-2">System Error</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">{errorMsg}</p>
                <button 
                  onClick={handleEndSession}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold tracking-wide transition-colors shadow-lg shadow-red-900/20"
                >
                  RESTART SYSTEM
                </button>
              </div>
           </div>
         )}
      </div>

      {/* Controls */}
      <div className="flex-none px-6 pb-8 pt-6">
         <div className="flex items-center justify-center gap-6">
             <button
              onClick={toggleMute}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 shadow-lg backdrop-blur-md ring-1 ${
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
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            
            <button
              onClick={handleEndSession}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm tracking-wide bg-black/40 text-red-400 ring-1 ring-red-500/30 hover:bg-red-950/50 hover:ring-red-500/60 hover:text-red-300 transition-all duration-300 shadow-lg backdrop-blur-md"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>
               <span>End Session</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default LiveSession;