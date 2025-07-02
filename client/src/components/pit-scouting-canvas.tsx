import { useRef, useEffect, useCallback, useState } from "react";
import type { CanvasData } from "@shared/schema";

interface PitScoutingCanvasProps {
  canvasData: CanvasData;
  pitStatuses: Record<string, 'not-visited' | 'done' | 'absent'>;
  onPitClick: (pitId: string, teamNumber: number, newStatus?: 'done' | 'absent') => void;
  getStatusColor: (status: 'not-visited' | 'done' | 'absent') => string;
}

interface StatusCircle {
  x: number;
  y: number;
  radius: number;
  status: 'done' | 'absent' | 'cancel';
  color: string;
  label: string;
  scale: number;
  opacity: number;
  isHovered: boolean;
}

interface HoldState {
  isHolding: boolean;
  pitId: string | null;
  teamNumber: number | null;
  startTime: number;
  mouseX: number;
  mouseY: number;
  circles: StatusCircle[];
  isFadingOut: boolean;
}

export default function PitScoutingCanvas({ 
  canvasData, 
  pitStatuses, 
  onPitClick, 
  getStatusColor 
}: PitScoutingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [holdState, setHoldState] = useState<HoldState>({
    isHolding: false,
    pitId: null,
    teamNumber: null,
    startTime: 0,
    mouseX: 0,
    mouseY: 0,
    circles: [],
    isFadingOut: false
  });

  const getCanvasCoordinates = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const createStatusCircles = useCallback((mouseX: number, mouseY: number): StatusCircle[] => {
    const circleRadius = 25;
    const distance = 50; // Distance from mouse cursor
    
    // Calculate triangle positions around mouse cursor
    const angle1 = -Math.PI / 2; // Top (90 degrees up)
    const angle2 = Math.PI / 6; // Bottom right (30 degrees)
    const angle3 = (5 * Math.PI) / 6; // Bottom left (150 degrees)
    
    return [
      {
        x: mouseX + Math.cos(angle1) * distance,
        y: mouseY + Math.sin(angle1) * distance,
        radius: circleRadius,
        status: 'done',
        color: '#22c55e', // Green
        label: '✓',
        scale: 1.0,
        opacity: 1.0,
        isHovered: false
      },
      {
        x: mouseX + Math.cos(angle2) * distance,
        y: mouseY + Math.sin(angle2) * distance,
        radius: circleRadius,
        status: 'absent',
        color: '#f59e0b', // Yellow/Orange
        label: '?',
        scale: 1.0,
        opacity: 1.0,
        isHovered: false
      },
      {
        x: mouseX + Math.cos(angle3) * distance,
        y: mouseY + Math.sin(angle3) * distance,
        radius: circleRadius,
        status: 'cancel',
        color: '#ef4444', // Red
        label: '✕',
        scale: 1.0,
        opacity: 1.0,
        isHovered: false
      }
    ];
  }, []);

  const isPointInCircle = useCallback((x: number, y: number, circle: StatusCircle): boolean => {
    const distance = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
    return distance <= circle.radius;
  }, []);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);
    
    // Check if clicked on a pit
    const clickedPit = canvasData.elements.find(element => {
      if (element.type === 'pit' && element.width && element.height && element.teamNumber) {
        return coords.x >= element.startX &&
               coords.x <= element.startX + element.width &&
               coords.y >= element.startY &&
               coords.y <= element.startY + element.height;
      }
      return false;
    });

    if (clickedPit && clickedPit.teamNumber) {
      // Start hold timer
      holdTimeoutRef.current = setTimeout(() => {
        const circles = createStatusCircles(coords.x, coords.y);
        setHoldState({
          isHolding: true,
          pitId: clickedPit.id,
          teamNumber: clickedPit.teamNumber!,
          startTime: Date.now(),
          mouseX: coords.x,
          mouseY: coords.y,
          circles,
          isFadingOut: false
        });
        redrawCanvas();
      }, 200); // 200ms hold delay (much faster)
    }
  }, [canvasData.elements, getCanvasCoordinates, createStatusCircles]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!holdState.isHolding) return;
    
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);
    
    // Check for hover over status circles and update hover state
    let hasHoverChange = false;
    const updatedCircles = holdState.circles.map(circle => {
      const isHovered = isPointInCircle(coords.x, coords.y, circle);
      if (isHovered !== circle.isHovered) {
        hasHoverChange = true;
        return { ...circle, isHovered };
      }
      return circle;
    });

    if (hasHoverChange) {
      setHoldState(prev => ({ ...prev, circles: updatedCircles }));
      
      // Start smooth scale animation
      const startTime = Date.now();
      const animationDuration = 150; // 150ms for smooth hover effect
      
      const animateScale = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        setHoldState(prev => ({
          ...prev,
          circles: prev.circles.map(circle => {
            const targetScale = circle.isHovered ? 1.1 : 1.0;
            const currentScale = circle.scale;
            const newScale = currentScale + (targetScale - currentScale) * progress * 0.3;
            return { ...circle, scale: newScale };
          })
        }));
        
        redrawCanvas();
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateScale);
        }
      };
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animateScale);
    }
  }, [holdState, getCanvasCoordinates, isPointInCircle]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    // Clear hold timer if still pending
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (holdState.isHolding) {
      const canvas = event.target as HTMLCanvasElement;
      if (!canvas) return;

      const coords = getCanvasCoordinates(event, canvas);
      
      // Check if released over a status circle
      const selectedCircle = holdState.circles.find(circle => 
        isPointInCircle(coords.x, coords.y, circle)
      );

      if (selectedCircle && holdState.pitId && holdState.teamNumber) {
        if (selectedCircle.status === 'done') {
          onPitClick(holdState.pitId, holdState.teamNumber, 'done');
        } else if (selectedCircle.status === 'absent') {
          onPitClick(holdState.pitId, holdState.teamNumber, 'absent');
        }
        // Cancel does nothing - just dismisses the circles
      }

      // Start fade-out animation
      setHoldState(prev => ({ ...prev, isFadingOut: true }));
      
      // Fade out animation
      const startTime = Date.now();
      const fadeOutDuration = 300; // 300ms fade out
      
      const animateFadeOut = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / fadeOutDuration, 1);
        const opacity = 1 - progress;
        
        if (progress < 1) {
          setHoldState(prev => ({
            ...prev,
            circles: prev.circles.map(circle => ({ ...circle, opacity }))
          }));
          redrawCanvas();
          requestAnimationFrame(animateFadeOut);
        } else {
          // Animation complete - reset hold state
          setHoldState({
            isHolding: false,
            pitId: null,
            teamNumber: null,
            startTime: 0,
            mouseX: 0,
            mouseY: 0,
            circles: [],
            isFadingOut: false
          });
          redrawCanvas();
        }
      };
      
      animateFadeOut();
    }
  }, [holdState, getCanvasCoordinates, isPointInCircle, onPitClick]);

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

    // Draw status circles if in hold state
    if (holdState.isHolding || holdState.isFadingOut) {
      holdState.circles.forEach(circle => {
        ctx.save();
        
        // Apply opacity for fade-out effect
        ctx.globalAlpha = circle.opacity;
        
        // Apply animated scale effect
        const effectiveScale = circle.scale;
        
        if (effectiveScale !== 1.0) {
          ctx.translate(circle.x, circle.y);
          ctx.scale(effectiveScale, effectiveScale);
          ctx.translate(-circle.x, -circle.y);
        }
        
        // Draw circle background
        ctx.fillStyle = circle.color;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw circle border - make it thicker when hovered
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = circle.isHovered ? 3 : 2;
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${circle.isHovered ? 18 : 16}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(circle.label, circle.x, circle.y);
        
        ctx.restore();
      });
    }

    ctx.restore();
  }, [canvasData, pitStatuses, getStatusColor, holdState]);

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

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert React events to native events for consistency
    const handleCanvasMouseDown = (e: Event) => handleMouseDown(e as MouseEvent);
    const handleCanvasMouseMove = (e: Event) => handleMouseMove(e as MouseEvent);
    const handleCanvasMouseUp = (e: Event) => handleMouseUp(e as MouseEvent);

    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    
    // Also handle mouse leave to cancel hold state
    const handleMouseLeave = () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
      setHoldState({
        isHolding: false,
        pitId: null,
        teamNumber: null,
        startTime: 0,
        mouseX: 0,
        mouseY: 0,
        circles: [],
        isFadingOut: false
      });
      redrawCanvas();
    };
    
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseup', handleCanvasMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      
      // Clear any pending hold timeout
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, redrawCanvas]);

  return (
    <div 
      ref={containerRef}
      className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
      style={{ height: '500px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-pointer"
      />
    </div>
  );
}