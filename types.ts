export enum AppState {
  LANDING = 'LANDING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  color?: string;
  className?: string;
}

export interface LiveConfig {
  model: string;
  systemInstruction: string;
}
