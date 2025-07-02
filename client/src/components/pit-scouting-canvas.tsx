import { useRef, useEffect, useCallback } from "react";
import type { CanvasData } from "@shared/schema";

interface PitScoutingCanvasProps {
  canvasData: CanvasData;
  pitStatuses: Record<string, 'not-visited' | 'done' | 'absent'>;
  onPitClick: (pitId: string, teamNumber: number) => void;
  getStatusColor: (status: 'not-visited' | 'done' | 'absent') => string;
}

export default function PitScoutingCanvas({ 
  canvasData, 
  pitStatuses, 
  onPitClick, 
  getStatusColor 
}: PitScoutingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCanvasCoordinates = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: any) => {
    ctx.strokeStyle = element.color || '#1976D2';
    ctx.lineWidth = element.strokeWidth || 2;
    
    switch (element.type) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(element.startX, element.startY);
        ctx.lineTo(element.endX || element.startX, element.endY || element.startY);
        ctx.stroke();
        break;
        
      case 'pit':
        if (element.width && element.height) {
          // Get status color for this pit
          const status = pitStatuses[element.id] || 'not-visited';
          const statusColor = getStatusColor(status);
          
          // Draw pit outline
          ctx.strokeStyle = statusColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(element.startX, element.startY, element.width, element.height);
          
          // Fill with status color (semi-transparent)
          ctx.save();
          ctx.globalAlpha = 0.4; // 40% opacity
          ctx.fillStyle = statusColor;
          ctx.fillRect(element.startX, element.startY, element.width, element.height);
          ctx.restore();
          
          // Draw team number if assigned
          if (element.teamNumber) {
            ctx.fillStyle = statusColor;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              `${element.teamNumber}`,
              element.startX + element.width / 2,
              element.startY + element.height / 2
            );
          }
        }
        break;
        
      case 'text':
        if (element.text) {
          ctx.fillStyle = element.color;
          ctx.font = '16px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(element.text, element.startX, element.startY);
        }
        break;
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transform
    ctx.save();
    ctx.scale(canvasData.zoom, canvasData.zoom);
    ctx.translate(canvasData.panX, canvasData.panY);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw all elements
    canvasData.elements.forEach(element => {
      drawElement(ctx, element);
    });

    ctx.restore();
  }, [canvasData, pitStatuses, getStatusColor]);

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

  // Redraw when canvas data or pit statuses change
  useEffect(() => {
    redrawCanvas();
  }, [canvasData, pitStatuses, redrawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(e.nativeEvent, canvas);
    
    // Find clicked pit element
    const clickedElement = canvasData.elements
      .slice()
      .reverse() // Check from top to bottom
      .find(element => {
        if (element.type !== 'pit' || !element.teamNumber) return false;
        return (
          coords.x >= element.startX &&
          coords.x <= element.startX + (element.width || 0) &&
          coords.y >= element.startY &&
          coords.y <= element.startY + (element.height || 0)
        );
      });

    if (clickedElement && clickedElement.teamNumber) {
      onPitClick(clickedElement.id, clickedElement.teamNumber);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
      style={{ height: '500px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
      />
    </div>
  );
}