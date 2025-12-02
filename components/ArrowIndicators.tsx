import React from 'react';
import { Vector3, MoveType } from '../types';
import { getRotationResult } from '../utils/cubeMath';
import * as THREE from 'three';

interface ArrowIndicatorsProps {
  cubiePosition: Vector3;
  clickedFaceNormal: Vector3; // The normal of the face the user clicked
  onRotate: (move: MoveType) => void;
}

// Helper: Reusable Arrow Component
const ArrowMesh: React.FC<{
  position: Vector3;
  direction: Vector3;
  onClick: () => void;
  color?: string;
}> = ({ position, direction, onClick, color = "#00ff00" }) => {
  // Normalize direction
  const dir = new THREE.Vector3(...direction).normalize();
  
  // Default cone points up (0,1,0), rotate to match dir
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <group quaternion={quaternion}>
        {/* Shaft */}
        <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.05, 0]}>
            <coneGeometry args={[0.12, 0.25, 12]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      
      {/* Invisible Hitbox for easier clicking */}
      <mesh visible={false} scale={[2, 2, 2]}>
         <boxGeometry args={[0.2, 0.2, 0.2]} />
         <meshBasicMaterial />
      </mesh>
    </group>
  );
};

export const ArrowIndicators: React.FC<ArrowIndicatorsProps> = ({ cubiePosition, clickedFaceNormal, onRotate }) => {
  const [x, y, z] = cubiePosition;
  const arrows: React.ReactNode[] = [];
  const normalVec = new THREE.Vector3(...clickedFaceNormal);
  
  // Constants
  const FACE_OFFSET = 0.6; 
  const RING_OFFSET = 0.35; 

  const moveDefs: Record<string, { axis: 'x'|'y'|'z', dir: number }> = {
      'R': { axis: 'x', dir: -1 },
      'L': { axis: 'x', dir: 1 },
      'U': { axis: 'y', dir: -1 },
      'D': { axis: 'y', dir: 1 },
      'F': { axis: 'z', dir: -1 },
      'B': { axis: 'z', dir: 1 },
  };

  const createArrowElement = (key: string, pos: Vector3, dir: Vector3, label: string, color: string = "#4ade80") => {
      arrows.push(
        <ArrowMesh 
            key={key}
            position={pos}
            direction={dir}
            onClick={() => onRotate(label as MoveType)}
            color={color}
        />
      );
  };

  const generateArrow = (moveCode: MoveType) => {
      const baseCode = moveCode.replace("'", "");
      const def = moveDefs[baseCode];
      
      let effectiveDir = def.dir;
      if (moveCode.includes("'")) effectiveDir *= -1;

      // 1. Is this block affected by this move?
      const isAffected = 
          (baseCode === 'R' && x === 1) ||
          (baseCode === 'L' && x === -1) ||
          (baseCode === 'U' && y === 1) ||
          (baseCode === 'D' && y === -1) ||
          (baseCode === 'F' && z === 1) ||
          (baseCode === 'B' && z === -1);
      
      if (!isAffected) return;

      // 2. Calculate Displacement
      const startPos = new THREE.Vector3(x, y, z);
      const nextPosVec = getRotationResult([x, y, z], def.axis, effectiveDir);
      const nextPos = new THREE.Vector3(...nextPosVec);
      
      const displacement = new THREE.Vector3().subVectors(nextPos, startPos);

      // 3. Logic Filter based on Displacement vs Clicked Face Normal
      
      // Case A: Center Piece Rotation (Displacement is 0)
      // If displacement is effectively zero, it's a center piece rotating in place.
      if (displacement.lengthSq() < 0.1) {
          // Only show rotation arrows if the rotation axis aligns with the normal.
          // e.g. Clicking Front Face (Normal Z) and doing F move (Axis Z).
          
          let axisVec = new THREE.Vector3();
          if (def.axis === 'x') axisVec.set(1, 0, 0);
          if (def.axis === 'y') axisVec.set(0, 1, 0);
          if (def.axis === 'z') axisVec.set(0, 0, 1);

          // Check alignment (abs dot product should be close to 1)
          if (Math.abs(axisVec.dot(normalVec)) > 0.9) {
             // Show Ring Arrow for this move
             // We want to place the arrow on the edge of the center piece.
             // We need a tangent direction.
             // For a center piece, we can pick 4 cardinal points around it.
             // But to keep it simple and not cluttered, let's just show ONE or TWO arrows?
             // User asked for fewer arrows.
             // Let's show 1 arrow for standard, 1 for prime?
             // Or maybe 4 small arrows is actually cleaner for centers because it signifies "Spin".
             // Let's stick to the previous Ring logic but filtered.
             
             // To simplify: Just put one arrow on the Top edge (relative to face) pointing right/left?
             // Actually, let's keep the ring but maybe just 2 arrows? 
             // Let's just create one arrow at the "Top" of the face pointing in rotation direction.
             
             // Find "Up" relative to the face normal
             let up = new THREE.Vector3(0, 1, 0);
             if (Math.abs(normalVec.y) > 0.9) up = new THREE.Vector3(0, 0, -1); // If looking at Top/Bottom, Up is Back
             
             // Create offset
             up.applyAxisAngle(axisVec, 0); // No rotation needed initially
             const ringPos = startPos.clone().add(up.clone().multiplyScalar(RING_OFFSET));
             
             // Calculate tangent direction at that ring position
             // Tangent = Axis x Radius
             const radius = new THREE.Vector3().subVectors(ringPos, startPos);
             const tangent = new THREE.Vector3().crossVectors(axisVec, radius).multiplyScalar(effectiveDir).normalize();
             
             // Push out to face
             ringPos.add(normalVec.clone().multiplyScalar(FACE_OFFSET));
             
             createArrowElement(
                 `${moveCode}-center`,
                 [ringPos.x, ringPos.y, ringPos.z],
                 [tangent.x, tangent.y, tangent.z],
                 moveCode,
                 "#ffffff"
             );
          }
          return;
      }

      // Case B: Edge/Corner Translation
      // We only want to show arrows that move PARALLEL to the clicked face.
      // i.e. Displacement dot Normal == 0.
      
      const dot = displacement.clone().normalize().dot(normalVec);
      
      // Allow slight tolerance, but basically strictly 0.
      // If dot is positive, it moves OUT (towards user). 
      // If dot is negative, it moves IN (away from user).
      // We only want 0 (sliding).
      
      if (Math.abs(dot) > 0.1) return; // Skip if moving into/out of face

      // Project displacement to ensure it's snapped to surface
      const direction = displacement.clone().normalize();
      
      // Calculate Arrow Position
      // Start at center
      const arrowPos = startPos.clone();
      
      // Push out to surface
      arrowPos.add(normalVec.clone().multiplyScalar(FACE_OFFSET));
      
      // Push towards the direction of movement (so it sits on the edge)
      arrowPos.add(direction.clone().multiplyScalar(0.4));

      createArrowElement(
          `${moveCode}-edge`,
          [arrowPos.x, arrowPos.y, arrowPos.z],
          [direction.x, direction.y, direction.z],
          moveCode
      );
  };

  // Check all moves
  ['R', 'R\'', 'L', 'L\'', 'U', 'U\'', 'D', 'D\'', 'F', 'F\'', 'B', 'B\''].forEach(m => generateArrow(m as MoveType));

  return <>{arrows}</>;
};