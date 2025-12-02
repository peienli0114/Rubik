export type Vector3 = [number, number, number];

export interface CubieData {
  id: number;
  position: Vector3; // The logical x, y, z position (-1, 0, 1)
  rotation: Vector3; // Current rotation in radians
  initialPosition: Vector3; // Added to determine sticker colors based on original face
}

// Notation: U (Up), D (Down), L (Left), R (Right), F (Front), B (Back)
// Prime (') means counter-clockwise
export type MoveType = 
  | 'U' | 'U\'' 
  | 'D' | 'D\'' 
  | 'L' | 'L\'' 
  | 'R' | 'R\'' 
  | 'F' | 'F\'' 
  | 'B' | 'B\'';

export const COLORS = {
  base: '#1a1a1a', // Dark plastic (almost black)
  U: '#FFFFFF', // White
  D: '#FFD500', // Yellow
  R: '#B90000', // Red
  L: '#FF5800', // Orange
  F: '#009E60', // Green
  B: '#0051BA', // Blue
};