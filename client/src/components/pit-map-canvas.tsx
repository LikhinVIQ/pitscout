import { useRef, useEffect, useCallback } from "react";
import { useCanvasDrawing } from "@/hooks/use-canvas-drawing";
import { useTouchEvents } from "@/hooks/use-touch-events";
import type { CanvasData, TeamAssignment } from "@shared/schema";

interface PitMapCanvasProps {
  canvasData: CanvasData;
  onCanvasDataChange: (data: CanvasData) => void;
  selectedTool: 'line' | 'pit' | 'text' | 'eraser' | 'grab';
  teamAssignments: TeamAssignment[];
  onTeamAssignment?: (teamNumber: number, pitElement: any) => void;
}

export default function PitMapCanvas({ 
  canvasData, 
  onCanvasDataChange, 
  selectedTool, 
  teamAssignments,
  onTeamAssignment
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

  // Handle drag and drop for team assignment
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    try {
      const teamData = JSON.parse(e.dataTransfer.getData('application/json'));
      const canvas = canvasRef.current;
      if (!canvas || !teamData.teamNumber) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const dropX = (e.clientX - rect.left) * scaleX;
      const dropY = (e.clientY - rect.top) * scaleY;

      // Find pit element at drop location
      const pitElement = canvasData.elements
        .slice()
        .reverse()
        .find(element => {
          if (element.type !== 'pit') return false;
          return (
            dropX >= element.startX &&
            dropX <= element.startX + (element.width || 0) &&
            dropY >= element.startY &&
            dropY <= element.startY + (element.height || 0)
          );
        });

      if (pitElement) {
        // Clear any existing team assignment from other pits first
        const clearedElements = canvasData.elements.map(element => 
          element.type === 'pit' && element.teamNumber === teamData.teamNumber
            ? { ...element, teamNumber: undefined }
            : element
        );
        
        // Update the pit element with team assignment
        const updatedElements = clearedElements.map(element => 
          element.id === pitElement.id 
            ? { ...element, teamNumber: teamData.teamNumber }
            : element
        );
        
        onCanvasDataChange({
          ...canvasData,
          elements: updatedElements,
        });

        // Create team assignment record (for pit map page to track)
        const newAssignment = {
          id: Date.now(), // Simple ID generation
          teamNumber: teamData.teamNumber,
          pitLocation: `Pit ${teamData.teamNumber}`,
          x: pitElement.startX,
          y: pitElement.startY,
          pitMapId: 0, // Will be set when pit map is saved
          createdAt: new Date(),
        };

        // Notify parent component of team assignment
        if (onTeamAssignment) {
          onTeamAssignment(teamData.teamNumber, pitElement);
        }
      }
    } catch (error) {
      console.error('Error handling team drop:', error);
    }
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
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
