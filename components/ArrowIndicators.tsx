import React from 'react';
import { Vector3, MoveType } from '../types';
import { getRotationResult } from '../utils/cubeMath';
import * as THREE from 'three';

interface ArrowIndicatorsProps {
  cubiePosition: Vector3;
  onRotate: (move: MoveType) => void;
}

const ArrowMesh: React.FC<{
  position: Vector3;
  direction: Vector3;
  onClick: () => void;
  color?: string;
}> = ({ position, direction, onClick, color = "#00ff00" }) => {
  // Normalize direction
  const dir = new THREE.Vector3(...direction).normalize();
  
  // Default cone points up (0,1,0)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <group position={position} quaternion={quaternion} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Floating Animation / Hover effect could be added here */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.12, 0.25, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      
      {/* Hitbox */}
      <mesh visible={false} scale={[2, 1.5, 2]}>
         <cylinderGeometry args={[0.15, 0.15, 0.6]} />
         <meshBasicMaterial />
      </mesh>
    </group>
  );
};

export const ArrowIndicators: React.FC<ArrowIndicatorsProps> = ({ cubiePosition, onRotate }) => {
  const [x, y, z] = cubiePosition;
  const arrows: React.ReactNode[] = [];
  
  // Configuration
  const FACE_OFFSET = 0.52; // Height above the face surface
  const EDGE_OFFSET = 0.42; // How far towards the edge of the block to push the arrow

  // Helper to place an arrow based on movement
  const addArrow = (
    axisName: 'x' | 'y' | 'z', // The face we are drawing on (e.g. 'z' for Front face)
    faceVal: number, // 1 (Front/Right/Up) or -1 (Back/Left/Down)
    moveCode: MoveType
  ) => {
    
    // 1. Determine rotation parameters
    let targetAxis: 'x'|'y'|'z' = 'x';
    let targetDir = 1;

    if (moveCode.startsWith('R')) { targetAxis = 'x'; targetDir = -1; }
    else if (moveCode.startsWith('L')) { targetAxis = 'x'; targetDir = 1; }
    else if (moveCode.startsWith('U')) { targetAxis = 'y'; targetDir = -1; }
    else if (moveCode.startsWith('D')) { targetAxis = 'y'; targetDir = 1; }
    else if (moveCode.startsWith('F')) { targetAxis = 'z'; targetDir = -1; }
    else if (moveCode.startsWith('B')) { targetAxis = 'z'; targetDir = 1; }
    if (moveCode.includes("'")) targetDir *= -1;

    // 2. Calculate the raw vector of movement (Secant)
    const nextPos = getRotationResult(cubiePosition, targetAxis, targetDir);
    let moveDir = new THREE.Vector3(
        nextPos[0] - x,
        nextPos[1] - y,
        nextPos[2] - z
    );

    // 3. Center Piece Logic (unchanged visual ring)
    const isCenter = moveDir.lengthSq() === 0;

    if (isCenter) {
        const isCW = !moveCode.includes("'");
        if (!isCW) return; // Only render CW ring for cleanliness

        if (axisName === 'z') { // Front/Back
            arrows.push(<ArrowMesh key={`${moveCode}-t`} position={[x, y + EDGE_OFFSET, z + (faceVal * FACE_OFFSET)]} direction={[faceVal, 0, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
            arrows.push(<ArrowMesh key={`${moveCode}-r`} position={[x + EDGE_OFFSET, y, z + (faceVal * FACE_OFFSET)]} direction={[0, -faceVal, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
            arrows.push(<ArrowMesh key={`${moveCode}-b`} position={[x, y - EDGE_OFFSET, z + (faceVal * FACE_OFFSET)]} direction={[-faceVal, 0, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
            arrows.push(<ArrowMesh key={`${moveCode}-l`} position={[x - EDGE_OFFSET, y, z + (faceVal * FACE_OFFSET)]} direction={[0, faceVal, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
        } else if (axisName === 'y') { // Up/Down
            arrows.push(<ArrowMesh key={`${moveCode}-t`} position={[x, y + (faceVal * FACE_OFFSET), z - EDGE_OFFSET]} direction={[faceVal, 0, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
            arrows.push(<ArrowMesh key={`${moveCode}-r`} position={[x + EDGE_OFFSET, y + (faceVal * FACE_OFFSET), z]} direction={[0, 0, faceVal]} onClick={() => onRotate(moveCode)} color="white"/>);
            arrows.push(<ArrowMesh key={`${moveCode}-b`} position={[x, y + (faceVal * FACE_OFFSET), z + EDGE_OFFSET]} direction={[-faceVal, 0, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
            arrows.push(<ArrowMesh key={`${moveCode}-l`} position={[x - EDGE_OFFSET, y + (faceVal * FACE_OFFSET), z]} direction={[0, 0, -faceVal]} onClick={() => onRotate(moveCode)} color="white"/>);
        } else { // Left/Right
             arrows.push(<ArrowMesh key={`${moveCode}-t`} position={[x + (faceVal * FACE_OFFSET), y + EDGE_OFFSET, z]} direction={[0, 0, faceVal]} onClick={() => onRotate(moveCode)} color="white"/>);
             arrows.push(<ArrowMesh key={`${moveCode}-f`} position={[x + (faceVal * FACE_OFFSET), y, z + EDGE_OFFSET]} direction={[0, -faceVal, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
             arrows.push(<ArrowMesh key={`${moveCode}-b`} position={[x + (faceVal * FACE_OFFSET), y - EDGE_OFFSET, z]} direction={[0, 0, -faceVal]} onClick={() => onRotate(moveCode)} color="white"/>);
             arrows.push(<ArrowMesh key={`${moveCode}-bk`} position={[x + (faceVal * FACE_OFFSET), y, z - EDGE_OFFSET]} direction={[0, faceVal, 0]} onClick={() => onRotate(moveCode)} color="white"/>);
        }

    } else {
        // 4. Refined Logic for Edge/Corner Pieces
        // Issue: Naive diff (moveDir) creates diagonal arrows for Edge pieces (e.g. Front->Top).
        // Solution: Snap to cardinal direction relative to the face.

        // Zero out the component normal to the face (we only want direction ON the face)
        if (axisName === 'x') moveDir.x = 0;
        if (axisName === 'y') moveDir.y = 0;
        if (axisName === 'z') moveDir.z = 0;

        // If diagonal (both non-zero), pick the dominant axis based on current position (Tangent Snap)
        // For an edge piece (e.g. at y=0, z=1 on X-face), rotation moves along Y. Z changes "into" depth.
        // We keep the component that slides ALONG the face boundary we are currently on.
        if (Math.abs(moveDir.x) > 0.1 && Math.abs(moveDir.y) > 0.1) {
             // Diagonal on XY plane (shouldn't happen for standard moves but just in case)
        } else if (Math.abs(moveDir.y) > 0.1 && Math.abs(moveDir.z) > 0.1) {
            // Diagonal on YZ plane (Right Face)
            // If we are at Z edge (abs(z)=1), we move along Y. Keep Y.
            if (Math.abs(z) > 0.9) moveDir.z = 0;
            // If we are at Y edge (abs(y)=1), we move along Z. Keep Z.
            else if (Math.abs(y) > 0.9) moveDir.y = 0;
        } else if (Math.abs(moveDir.x) > 0.1 && Math.abs(moveDir.z) > 0.1) {
            // Diagonal on XZ plane (Up Face)
            if (Math.abs(z) > 0.9) moveDir.z = 0;
            else if (Math.abs(x) > 0.9) moveDir.x = 0;
        } else if (Math.abs(moveDir.x) > 0.1 && Math.abs(moveDir.y) > 0.1) {
             // Diagonal on XY plane (Front Face)
             if (Math.abs(y) > 0.9) moveDir.y = 0;
             else if (Math.abs(x) > 0.9) moveDir.x = 0;
        }

        moveDir.normalize();

        // Calculate offset position to push arrow to the edge of the block
        const arrowPos = new THREE.Vector3(x, y, z);
        if (axisName === 'x') arrowPos.x += faceVal * FACE_OFFSET;
        if (axisName === 'y') arrowPos.y += faceVal * FACE_OFFSET;
        if (axisName === 'z') arrowPos.z += faceVal * FACE_OFFSET;

        // Push towards the direction of movement
        arrowPos.add(moveDir.clone().multiplyScalar(EDGE_OFFSET));

        arrows.push(
            <ArrowMesh 
                key={moveCode}
                position={[arrowPos.x, arrowPos.y, arrowPos.z]}
                direction={[moveDir.x, moveDir.y, moveDir.z]}
                onClick={() => onRotate(moveCode)}
                color="#4ade80"
            />
        );
    }
  };

  // Logic to determine which face to render arrows on
  const checkAndAdd = (axis: 'x'|'y'|'z', val: number, cw: MoveType, ccw: MoveType) => {
      const isCorrectFace = (axis === 'x' && x === val) || (axis === 'y' && y === val) || (axis === 'z' && z === val);
      if (isCorrectFace) {
          addArrow(axis, val, cw);
          addArrow(axis, val, ccw);
      }
  }

  // Right / Left
  if (x === 1) checkAndAdd('x', 1, 'R', "R'");
  if (x === -1) checkAndAdd('x', -1, "L'", 'L');

  // Up / Down
  if (y === 1) checkAndAdd('y', 1, 'U', "U'");
  if (y === -1) checkAndAdd('y', -1, "D'", 'D');

  // Front / Back
  if (z === 1) checkAndAdd('z', 1, 'F', "F'");
  if (z === -1) checkAndAdd('z', -1, "B'", 'B');

  return <>{arrows}</>;
};