import { useRef, useEffect, useCallback } from "react";
import { useCanvasDrawing } from "@/hooks/use-canvas-drawing";
import { useTouchEvents } from "@/hooks/use-touch-events";
import type { CanvasData, TeamAssignment } from "@shared/schema";

interface PitMapCanvasProps {
  canvasData: CanvasData;
  onCanvasDataChange: (data: CanvasData) => void;
  selectedTool: 'line' | 'pit' | 'text' | 'eraser' | 'grab';
  teamAssignments: TeamAssignment[];
}

export default function PitMapCanvas({ 
  canvasData, 
  onCanvasDataChange, 
  selectedTool, 
  teamAssignments 
}: PitMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    redrawCanvas 
  } = useCanvasDrawing({
    canvasData,
    onCanvasDataChange,
    selectedTool,
  });

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTouchEvents({
    onStart: handleMouseDown,
    onMove: handleMouseMove,
    onEnd: handleMouseUp,
  });

  // Resize canvas when container size changes
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Redraw after resize
    redrawCanvas();
  }, [redrawCanvas]);

  // Set up canvas
  useEffect(() => {
    resizeCanvas();
    
    const handleResize = () => {
      resizeCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas]);

  // Redraw when canvas data changes
  useEffect(() => {
    redrawCanvas();
  }, [canvasData, redrawCanvas]);

  // Get cursor class based on selected tool
  const getCursorClass = () => {
    switch (selectedTool) {
      case 'line':
        return 'cursor-crosshair';
      case 'pit':
        return 'cursor-copy';
      case 'text':
        return 'cursor-text';
      case 'eraser':
        return 'cursor-not-allowed';
      case 'grab':
        return 'cursor-grab';
      default:
        return 'cursor-default';
    }
  };

  // Event wrapper functions to handle React event types
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseDown(e.nativeEvent);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseMove(e.nativeEvent);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseUp();
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleTouchStart(e.nativeEvent);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleTouchMove(e.nativeEvent);
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleTouchEnd(e.nativeEvent);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden canvas-container ${getCursorClass()}`}
      style={{ height: '500px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full touch-none"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
        onTouchEnd={handleCanvasTouchEnd}
      />
      
      {/* Canvas Overlay for UI Elements */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-md pointer-events-none">
        <div className="text-sm text-gray-600">
          <p>Zoom: {Math.round(canvasData.zoom * 100)}%</p>
          <p>Tool: {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}</p>
          <p>Elements: {canvasData.elements.length}</p>
        </div>
      </div>
      
      {/* Touch Instructions for Mobile */}
      <div className="absolute bottom-4 left-4 bg-frc-blue bg-opacity-90 text-white rounded-lg p-3 text-sm md:hidden pointer-events-none">
        <p>👆 Tap to draw</p>
        <p>🤏 Pinch to zoom</p>
        <p>👌 Drag to pan</p>
      </div>
    </div>
  );
}
