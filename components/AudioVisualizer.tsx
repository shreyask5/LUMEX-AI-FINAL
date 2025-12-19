import React, { useEffect, useRef } from 'react';
import { AudioVisualizerProps } from '../types';

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isActive, color = '#60A5FA', className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const audioContextRef = useRef<AudioContext>();
  const sourceRef = useRef<MediaStreamAudioSourceNode>();

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    // Initialize Audio Context for visualization if not exists
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Create source
    try {
      // Check if the stream is active and has audio tracks
      if (stream.getAudioTracks().length > 0) {
        // Create media stream source only if not already created or if we need to recreate (simplified here)
        if (!sourceRef.current) {
             const source = ctx.createMediaStreamSource(stream);
             source.connect(analyser);
             sourceRef.current = source;
        }
      }
    } catch (e) {
      console.error("Error creating media stream source for visualizer:", e);
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Simple bar visualizer
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        canvasCtx.fillStyle = color;
        // Rounded bars logic simplified for canvas
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      // We don't disconnect source/close context here to avoid audio graph issues during re-renders in this simple implementation
    };
  }, [stream, isActive, color]);

  // Default styles if no className provided
  const defaultStyles = "w-full h-24 rounded-lg bg-gray-800/50 backdrop-blur-sm";

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className={className || defaultStyles}
      aria-hidden="true"
    />
  );
};

export default AudioVisualizer;
