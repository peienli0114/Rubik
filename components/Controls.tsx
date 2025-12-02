import React from 'react';
import { MoveType } from '../types';
import { RotateCw, RotateCcw, Shuffle, RefreshCcw, Hand } from 'lucide-react';

interface ControlsProps {
  onRotate: (move: MoveType) => void;
  onScramble: () => void;
  onReset: () => void;
  visibleFaceCodes: string[];
}

export const Controls: React.FC<ControlsProps> = ({ onRotate, onScramble, onReset, visibleFaceCodes }) => {
  // If we have selected a face, we now show ARROWS on the cube.
  // We can hide the complex button dashboard to reduce clutter and let the user focus on the 3D arrows.
  const isSelectionActive = visibleFaceCodes.length > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none flex flex-col items-center justify-end gap-4 z-10">
      
      {/* Top Action Bar */}
      <div className="flex gap-4 pointer-events-auto bg-black/60 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
        <button onClick={onScramble} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-indigo-500/30 active:translate-y-0.5">
          <Shuffle size={18} /> 打亂
        </button>
        <button onClick={onReset} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-rose-500/30 active:translate-y-0.5">
          <RefreshCcw size={18} /> 重置
        </button>
      </div>

      {/* Helper Text */}
      {!isSelectionActive ? (
        <div className="bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10 text-white/70 flex items-center gap-2 animate-pulse">
            <Hand size={18} className="text-blue-400"/> 
            <span className="text-sm font-medium">點擊方塊以顯示旋轉箭頭 (Click a block to show arrows)</span>
        </div>
      ) : (
         <div className="bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10 text-green-400 flex items-center gap-2">
            <span className="text-sm font-bold">點擊箭頭旋轉 (Click arrows to rotate)</span>
            <span className="text-xs text-white/50 ml-2">點擊背景取消</span>
        </div>
      )}
      
      <div className="text-white/30 text-[10px] text-center font-medium tracking-wide uppercase">
        Drag BG to orbit • Click Block to Select
      </div>
    </div>
  );
};