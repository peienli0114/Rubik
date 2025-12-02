import React, { useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { RubiksCube } from './components/RubiksCube';
import { Controls } from './components/Controls';
import { MoveType } from './types';

// Define the interface for the cube actions ref
interface CubeActions {
  rotate: (move: MoveType) => void;
  scramble: () => void;
  reset: () => void;
}

const App: React.FC = () => {
  const cubeActions = useRef<CubeActions | null>(null);
  const [availableFaces, setAvailableFaces] = useState<string[]>([]);

  const handleCubeReady = useCallback((actions: CubeActions) => {
    cubeActions.current = actions;
  }, []);

  const handleRotate = (move: MoveType) => {
    cubeActions.current?.rotate(move);
  };

  const handleScramble = () => {
    cubeActions.current?.scramble();
    setAvailableFaces([]); // Clear selection on scramble
  };

  const handleReset = () => {
    cubeActions.current?.reset();
    setAvailableFaces([]); // Clear selection on reset
  };

  const handleSelectionChange = useCallback((faces: string[]) => {
    setAvailableFaces(faces);
  }, []);

  const handleBackgroundClick = (e: any) => {
    // We only want to deselect if the user actually clicked the background,
    // not just dragged (OrbitControls handles dragging).
    // The onPointerMissed event from Canvas handles clicks on nothing.
    setAvailableFaces([]);
  };

  return (
    <div className="w-full h-full bg-gray-900 relative selection:bg-none">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={handleBackgroundClick}>
        <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
        
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <spotLight 
            position={[10, 10, 10]} 
            angle={0.15} 
            penumbra={1} 
            intensity={1.5} 
            castShadow 
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* The Cube */}
        <RubiksCube 
            onReady={handleCubeReady} 
            onSelectionChange={handleSelectionChange}
            externalSelectedFaces={availableFaces} // Pass down to help with clearing logic if needed
        />

        {/* Controls */}
        <OrbitControls 
            enablePan={false} 
            minDistance={4} 
            maxDistance={15} 
            target={[0, 0, 0]}
        />
      </Canvas>

      {/* UI Overlay */}
      <Controls 
        onRotate={handleRotate} 
        onScramble={handleScramble} 
        onReset={handleReset}
        visibleFaceCodes={availableFaces}
      />

      {/* Title / Watermark */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
          RUBIK'S <span className="text-blue-500">3D</span>
        </h1>
        <p className="text-gray-400 text-sm font-medium">React + Three Fiber</p>
      </div>
    </div>
  );
};

export default App;