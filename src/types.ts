export type ShapeType = 'rectangle' | 'circle' | 'squircle' | 'polygon';

export interface MaskSettings {
  width: number;
  height: number;
  type: ShapeType;
  cornerRadius: number;
  squircleSmoothness: number;
  polygonSides: number;
  rotation: number;
  padding: number;
  borderThickness: number;
  inverted: boolean;
  exportScale: number;
}

export const PRESETS = [
  { name: '16:9 Webcam', width: 1920, height: 1080 },
  { name: '4:3 Standard', width: 1440, height: 1080 },
  { name: '1:1 Square', width: 1080, height: 1080 },
  { name: '9:16 Vertical', width: 1080, height: 1920 },
];
