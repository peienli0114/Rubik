import React from 'react';
import { RoundedBox } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { COLORS, Vector3 } from '../types';

interface CubieProps {
  position: Vector3;
  rotation: Vector3;
  initialPosition: Vector3; // Used to determine sticker color
  scale?: number;
  isSelected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export const Cubie: React.FC<CubieProps> = ({ position, rotation, initialPosition, scale = 1, isSelected = false, onClick }) => {
  const [ix, iy, iz] = initialPosition;
  
  // Dimensions
  const CUBE_SIZE = 0.95;
  const RADIUS = 0.08; // Rounded corners for the plastic base
  
  // Sticker configuration
  const STICKER_SIZE = 0.85; // Size of the colored sticker
  const STICKER_OFFSET = CUBE_SIZE / 2 + 0.005; // Offset to sit on top of the face
  const STICKER_THICKNESS = 0.01; // Thin layer for the sticker

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]} onClick={onClick}>
      {/* Base Black Plastic Cube - Glows when selected */}
      <RoundedBox args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} radius={RADIUS} smoothness={4}>
        <meshStandardMaterial 
            color={COLORS.base} 
            roughness={0.6} 
            metalness={0.1}
            emissive={isSelected ? 'white' : 'black'}
            emissiveIntensity={isSelected ? 0.5 : 0}
        />
      </RoundedBox>

      {/* Stickers - Only render if this face was originally external */}
      
      {/* Right (x=1) - Red */}
      {ix === 1 && (
        <mesh position={[STICKER_OFFSET, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS]} />
          <meshStandardMaterial color={COLORS.R} roughness={0.2} metalness={0} />
        </mesh>
      )}

      {/* Left (x=-1) - Orange */}
      {ix === -1 && (
        <mesh position={[-STICKER_OFFSET, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
           <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS]} />
          <meshStandardMaterial color={COLORS.L} roughness={0.2} metalness={0} />
        </mesh>
      )}

      {/* Top (y=1) - White */}
      {iy === 1 && (
        <mesh position={[0, STICKER_OFFSET, 0]} rotation={[-Math.PI / 2, 0, 0]}>
           <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS]} />
          <meshStandardMaterial color={COLORS.U} roughness={0.2} metalness={0} />
        </mesh>
      )}

      {/* Bottom (y=-1) - Yellow */}
      {iy === -1 && (
        <mesh position={[0, -STICKER_OFFSET, 0]} rotation={[Math.PI / 2, 0, 0]}>
           <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS]} />
          <meshStandardMaterial color={COLORS.D} roughness={0.2} metalness={0} />
        </mesh>
      )}

      {/* Front (z=1) - Green */}
      {iz === 1 && (
        <mesh position={[0, 0, STICKER_OFFSET]} rotation={[0, 0, 0]}>
           <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS]} />
          <meshStandardMaterial color={COLORS.F} roughness={0.2} metalness={0} />
        </mesh>
      )}

      {/* Back (z=-1) - Blue */}
      {iz === -1 && (
        <mesh position={[0, 0, -STICKER_OFFSET]} rotation={[0, Math.PI, 0]}>
           <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS]} />
          <meshStandardMaterial color={COLORS.B} roughness={0.2} metalness={0} />
        </mesh>
      )}
    </group>
  );
};