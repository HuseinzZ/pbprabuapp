export interface WheelSegment {
  id: string;
  text: string;
  weight: number;
  color: string;
  textColor: string;
}

export interface SpinHistoryEntry {
  id: string;
  segmentId: string;
  segmentText: string;
  timestamp: string;
  color: string;
}

export interface WheelConfig {
  duration: number;
  minRotations: number;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  hapticFeedback: boolean;
}
