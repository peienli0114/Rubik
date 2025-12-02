import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Cubie } from './Cubie';
import { ArrowIndicators } from './ArrowIndicators';
import { CubieData, MoveType, Vector3 } from '../types';
import { rotateX, rotateY, rotateZ, roundVector } from '../utils/cubeMath';
import * as THREE from 'three';

interface RubiksCubeProps {
  onReady?: (actions: { 
    rotate: (move: MoveType) => void;
    scramble: () => void;
    reset: () => void;
  }) => void;
  onSelectionChange?: (faces: string[]) => void;
  externalSelectedFaces?: string[];
}

// Initial state generation
const generateSolvedCube = (): CubieData[] => {
  const cubies: CubieData[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const pos: Vector3 = [x, y, z];
        cubies.push({
          id: id++,
          position: pos,
          rotation: [0, 0, 0],
          initialPosition: pos, // Store the original position
        });
      }
    }
  }
  return cubies;
};

// Animation config
const ANIMATION_SPEED = 0.15; // Radians per frame approx
const TOTAL_ROTATION = Math.PI / 2;

export const RubiksCube: React.FC<RubiksCubeProps> = ({ onReady, onSelectionChange, externalSelectedFaces }) => {
  const [cubies, setCubies] = useState<CubieData[]>(generateSolvedCube());
  const [selectedCubieId, setSelectedCubieId] = useState<number | null>(null);
  const [clickedFaceNormal, setClickedFaceNormal] = useState<Vector3 | null>(null);
  
  // Clear internal selection if external faces are cleared (e.g. background click)
  useEffect(() => {
    if (externalSelectedFaces && externalSelectedFaces.length === 0) {
      setSelectedCubieId(null);
      setClickedFaceNormal(null);
    }
  }, [externalSelectedFaces]);

  // Animation State
  const isAnimating = useRef(false);
  const animationQueue = useRef<MoveType[]>([]);
  const currentMove = useRef<{
    type: MoveType;
    axis: 'x' | 'y' | 'z';
    layer: number; // -1, 0, 1
    direction: number; // 1 or -1
    progress: number;
    activeCubieIds: number[];
  } | null>(null);

  // Helper to find cubies in a specific layer
  const getCubiesInLayer = useCallback((axis: 'x' | 'y' | 'z', layer: number, currentCubies: CubieData[]) => {
    return currentCubies.filter(c => Math.round(c.position[axis === 'x' ? 0 : axis === 'y' ? 1 : 2]) === layer).map(c => c.id);
  }, []);

  const triggerRotate = useCallback((move: MoveType) => {
    animationQueue.current.push(move);
  }, []);

  const resetCube = useCallback(() => {
    setCubies(generateSolvedCube());
    animationQueue.current = [];
    currentMove.current = null;
    isAnimating.current = false;
    setSelectedCubieId(null);
    setClickedFaceNormal(null);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const scrambleCube = useCallback(() => {
    const moves: MoveType[] = ['U', 'D', 'L', 'R', 'F', 'B', 'U\'', 'D\'', 'L\'', 'R\'', 'F\'', 'B\''];
    for(let i=0; i<25; i++) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        triggerRotate(randomMove);
    }
    setSelectedCubieId(null);
    setClickedFaceNormal(null);
  }, [triggerRotate]);

  // Expose controls to parent
  useEffect(() => {
    if (onReady) {
      onReady({
        rotate: triggerRotate,
        scramble: scrambleCube,
        reset: resetCube
      });
    }
  }, [onReady, triggerRotate, scrambleCube, resetCube]);

  // Handle click on a specific cubie
  const handleCubieClick = (e: ThreeEvent<MouseEvent>, cubie: CubieData) => {
    e.stopPropagation();

    // Prevent selection during animation
    if (isAnimating.current) return;

    setSelectedCubieId(cubie.id);
    
    // Capture and snap normal
    if (e.normal) {
        const n = e.normal.clone().normalize();
        // Snap to nearest axis to handle slight float errors or rotation drift
        const maxComp = Math.max(Math.abs(n.x), Math.abs(n.y), Math.abs(n.z));
        const snapped: Vector3 = [
            Math.abs(n.x) === maxComp ? Math.sign(n.x) : 0,
            Math.abs(n.y) === maxComp ? Math.sign(n.y) : 0,
            Math.abs(n.z) === maxComp ? Math.sign(n.z) : 0,
        ];
        setClickedFaceNormal(snapped);
    }

    // Determine which faces can move based on current logical position
    const [x, y, z] = roundVector(cubie.position);
    const validFaces: string[] = [];

    // X-Axis layers (Left/Right)
    if (x === 1) validFaces.push('R');
    if (x === -1) validFaces.push('L');

    // Y-Axis layers (Up/Down)
    if (y === 1) validFaces.push('U');
    if (y === -1) validFaces.push('D');

    // Z-Axis layers (Front/Back)
    if (z === 1) validFaces.push('F');
    if (z === -1) validFaces.push('B');
    
    // Also consider Center pieces (x=0, y=0, etc) as valid controls for that face
    if (x === 0 && y === 0 && z === 1) validFaces.push('F');
    if (x === 0 && y === 0 && z === -1) validFaces.push('B');
    if (x === 1 && y === 0 && z === 0) validFaces.push('R');
    if (x === -1 && y === 0 && z === 0) validFaces.push('L');
    if (x === 0 && y === 1 && z === 0) validFaces.push('U');
    if (x === 0 && y === -1 && z === 0) validFaces.push('D');

    onSelectionChange?.(validFaces);
  };

  // Main Animation Loop
  useFrame((state, delta) => {
    // 1. If not animating, check queue
    if (!isAnimating.current && animationQueue.current.length > 0) {
      const move = animationQueue.current.shift()!;
      let axis: 'x' | 'y' | 'z' = 'y';
      let layer = 0;
      let direction = 1;

      // Parse move
      switch (move[0]) {
        case 'R': axis = 'x'; layer = 1; direction = -1; break; // Right Face, X=1 (CW is -90)
        case 'L': axis = 'x'; layer = -1; direction = 1; break; // Left Face, X=-1 (CW is +90)
        case 'U': axis = 'y'; layer = 1; direction = -1; break; // Up Face, Y=1
        case 'D': axis = 'y'; layer = -1; direction = 1; break; // Down Face, Y=-1
        case 'F': axis = 'z'; layer = 1; direction = -1; break; // Front Face, Z=1
        case 'B': axis = 'z'; layer = -1; direction = 1; break; // Back Face, Z=-1
      }

      if (move.includes("'")) {
        direction *= -1;
      }

      const activeIds = getCubiesInLayer(axis, layer, cubies);

      currentMove.current = {
        type: move,
        axis,
        layer,
        direction,
        progress: 0,
        activeCubieIds: activeIds
      };
      isAnimating.current = true;
    }

    // 2. Handle current animation
    if (isAnimating.current && currentMove.current) {
      const speed = animationQueue.current.length > 5 ? ANIMATION_SPEED * 4 : ANIMATION_SPEED;
      
      currentMove.current.progress += speed;

      if (currentMove.current.progress >= TOTAL_ROTATION) {
        // Animation Complete
        const { axis, direction, activeCubieIds } = currentMove.current;
        const angle = direction * (Math.PI / 2); // 90 degrees

        setCubies(prevCubies => {
          return prevCubies.map(c => {
            if (!activeCubieIds.includes(c.id)) return c;

            // Apply rotation to position
            let newPos = [...c.position] as Vector3;
            if (axis === 'x') newPos = rotateX(newPos, angle);
            else if (axis === 'y') newPos = rotateY(newPos, angle);
            else if (axis === 'z') newPos = rotateZ(newPos, angle);
            
            // Fix float precision errors immediately
            newPos = roundVector(newPos);

            // Apply rotation to orientation
            const objRot = new THREE.Euler(...c.rotation);
            const objQuat = new THREE.Quaternion().setFromEuler(objRot);
            
            const axisVec = new THREE.Vector3(
                axis === 'x' ? 1 : 0,
                axis === 'y' ? 1 : 0,
                axis === 'z' ? 1 : 0
            );
            const rotQuat = new THREE.Quaternion().setFromAxisAngle(axisVec, angle);
            
            // World rotation: q_new = q_rot * q_old (premultiply)
            objQuat.premultiply(rotQuat);
            
            const newEuler = new THREE.Euler().setFromQuaternion(objQuat);

            return {
              ...c,
              position: newPos,
              rotation: [newEuler.x, newEuler.y, newEuler.z]
            };
          });
        });

        isAnimating.current = false;
        currentMove.current = null;
      }
    }
  });

  const selectedCubie = cubies.find(c => c.id === selectedCubieId);

  return (
    <group>
      {/* Render Arrows if a cubie is selected and not animating */}
      {selectedCubie && !isAnimating.current && clickedFaceNormal && (
        <ArrowIndicators 
            cubiePosition={selectedCubie.position} 
            clickedFaceNormal={clickedFaceNormal}
            onRotate={triggerRotate} 
        />
      )}

      {cubies.map((c) => {
        // Calculate transient rotation for animation
        let visualRotation = [...c.rotation] as Vector3;
        let visualPosition = [...c.position] as Vector3;

        if (isAnimating.current && currentMove.current && currentMove.current.activeCubieIds.includes(c.id)) {
            const { axis, direction, progress } = currentMove.current;
            const angle = direction * progress;
            
            // Visual Position Rotation (Orbit around center)
            if (axis === 'x') visualPosition = rotateX(visualPosition, angle);
            else if (axis === 'y') visualPosition = rotateY(visualPosition, angle);
            else if (axis === 'z') visualPosition = rotateZ(visualPosition, angle);

            // Visual Self Rotation
            const objRot = new THREE.Euler(...c.rotation);
            const objQuat = new THREE.Quaternion().setFromEuler(objRot);
            const axisVec = new THREE.Vector3(
                axis === 'x' ? 1 : 0,
                axis === 'y' ? 1 : 0,
                axis === 'z' ? 1 : 0
            );
            const rotQuat = new THREE.Quaternion().setFromAxisAngle(axisVec, angle);
            objQuat.premultiply(rotQuat);
            const newEuler = new THREE.Euler().setFromQuaternion(objQuat);
            visualRotation = [newEuler.x, newEuler.y, newEuler.z];
        }

        return (
          <Cubie 
            key={c.id} 
            position={visualPosition} 
            rotation={visualRotation} 
            initialPosition={c.initialPosition}
            isSelected={selectedCubieId === c.id}
            onClick={(e) => handleCubieClick(e, c)}
          />
        );
      })}
    </group>
  );
};