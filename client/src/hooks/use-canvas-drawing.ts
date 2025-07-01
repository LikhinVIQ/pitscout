import { useRef, useCallback } from "react";
import { generateId, isPointInElement, snapToGrid } from "@/lib/canvas-utils";
import type { CanvasData, DrawingElement } from "@shared/schema";

interface UseCanvasDrawingProps {
  canvasData: CanvasData;
  onCanvasDataChange: (data: CanvasData) => void;
  selectedTool: 'line' | 'pit' | 'text' | 'eraser' | 'grab';
}

export function useCanvasDrawing({ 
  canvasData, 
  onCanvasDataChange, 
  selectedTool 
}: UseCanvasDrawingProps) {
  const isDrawing = useRef(false);
  const currentElement = useRef<DrawingElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragElement = useRef<DrawingElement | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const getCanvasCoordinates = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
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
  }, [canvasData]);

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

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'line':
        if (element.endX !== undefined && element.endY !== undefined) {
          ctx.beginPath();
          ctx.moveTo(element.startX, element.startY);
          ctx.lineTo(element.endX, element.endY);
          ctx.stroke();
        }
        break;
        
      case 'pit':
        if (element.width && element.height) {
          ctx.strokeRect(element.startX, element.startY, element.width, element.height);
          
          // Fill with semi-transparent color
          ctx.fillStyle = element.color + '20';
          ctx.fillRect(element.startX, element.startY, element.width, element.height);
          
          // Draw team number if assigned
          if (element.teamNumber) {
            ctx.fillStyle = element.color;
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
              `Team ${element.teamNumber}`,
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

  const handleMouseDown = useCallback((event: MouseEvent) => {
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);
    
    // Check if we're clicking on an existing element for dragging (pit tool or grab tool)
    if (selectedTool === 'pit' || selectedTool === 'grab') {
      const clickedElement = canvasData.elements
        .slice()
        .reverse() // Check from top to bottom
        .find(element => {
          // For pit tool, only allow dragging pits; for grab tool, allow any element
          return selectedTool === 'grab' 
            ? isPointInElement(coords.x, coords.y, element)
            : element.type === 'pit' && isPointInElement(coords.x, coords.y, element);
        });
        
      if (clickedElement) {
        // Start dragging existing element
        isDragging.current = true;
        dragElement.current = clickedElement;
        dragOffset.current = {
          x: coords.x - clickedElement.startX,
          y: coords.y - clickedElement.startY,
        };
        return;
      }
    }
    
    // If using grab tool and no element clicked, do nothing
    if (selectedTool === 'grab') {
      return;
    }
    
    isDrawing.current = true;
    lastPoint.current = coords;

    switch (selectedTool) {
      case 'line':
        currentElement.current = {
          id: generateId(),
          type: 'line',
          startX: coords.x,
          startY: coords.y,
          endX: coords.x,
          endY: coords.y,
          color: '#1976D2',
          strokeWidth: 2,
        };
        break;
        
      case 'pit':
        // Create a 10x10 pit square immediately
        const pitElement: DrawingElement = {
          id: generateId(),
          type: 'pit',
          startX: coords.x - 25, // Center the pit on click
          startY: coords.y - 25,
          width: 50,
          height: 50,
          color: '#1976D2',
          strokeWidth: 2,
        };
        
        onCanvasDataChange({
          ...canvasData,
          elements: [...canvasData.elements, pitElement],
        });
        
        // Don't set currentElement since pit is created immediately
        isDrawing.current = false;
        return;
        
      case 'text':
        const text = prompt('Enter text:');
        if (text) {
          const textElement: DrawingElement = {
            id: generateId(),
            type: 'text',
            startX: coords.x,
            startY: coords.y,
            text,
            color: '#1976D2',
            strokeWidth: 2,
          };
          
          onCanvasDataChange({
            ...canvasData,
            elements: [...canvasData.elements, textElement],
          });
        }
        isDrawing.current = false;
        return;
        
      case 'eraser':
        // Find and remove element at click position
        const elementToRemove = canvasData.elements.find(element => {
          // Simple hit detection - can be improved
          return Math.abs(element.startX - coords.x) < 10 && 
                 Math.abs(element.startY - coords.y) < 10;
        });
        
        if (elementToRemove) {
          onCanvasDataChange({
            ...canvasData,
            elements: canvasData.elements.filter(el => el.id !== elementToRemove.id),
          });
        }
        isDrawing.current = false;
        return;
    }
  }, [selectedTool, canvasData, onCanvasDataChange, getCanvasCoordinates]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);
    
    // Handle dragging elements
    if (isDragging.current && dragElement.current && dragOffset.current) {
      const newX = coords.x - dragOffset.current.x;
      const newY = coords.y - dragOffset.current.y;
      
      const updatedElements = canvasData.elements.map(element => {
        if (element.id === dragElement.current!.id) {
          const deltaX = newX - element.startX;
          const deltaY = newY - element.startY;
          
          // Handle different element types for dragging
          if (element.type === 'line') {
            return {
              ...element,
              startX: newX,
              startY: newY,
              endX: (element.endX || element.startX) + deltaX,
              endY: (element.endY || element.startY) + deltaY,
            };
          } else {
            // Handle pit, text, and other elements
            return { ...element, startX: newX, startY: newY };
          }
        }
        return element;
      });
      
      onCanvasDataChange({
        ...canvasData,
        elements: updatedElements,
      });
      return;
    }
    
    if (!isDrawing.current || !currentElement.current) return;

    switch (selectedTool) {
      case 'line':
        // Snap line to horizontal or vertical direction
        const deltaX = coords.x - currentElement.current.startX;
        const deltaY = coords.y - currentElement.current.startY;
        
        // Determine if line should be horizontal or vertical based on which direction is more dominant
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Make horizontal line
          currentElement.current.endX = coords.x;
          currentElement.current.endY = currentElement.current.startY;
        } else {
          // Make vertical line
          currentElement.current.endX = currentElement.current.startX;
          currentElement.current.endY = coords.y;
        }
        break;
        
      case 'pit':
        const width = coords.x - currentElement.current.startX;
        const height = coords.y - currentElement.current.startY;
        currentElement.current.width = Math.abs(width);
        currentElement.current.height = Math.abs(height);
        
        // Adjust start position if drawing backwards
        if (width < 0) {
          currentElement.current.startX = coords.x;
        }
        if (height < 0) {
          currentElement.current.startY = coords.y;
        }
        break;
    }

    // Update canvas with current element
    const tempElements = [...canvasData.elements, currentElement.current];
    onCanvasDataChange({
      ...canvasData,
      elements: tempElements,
    });
  }, [isDrawing, selectedTool, canvasData, onCanvasDataChange, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    // Handle drag completion
    if (isDragging.current) {
      isDragging.current = false;
      dragElement.current = null;
      dragOffset.current = null;
      return;
    }
    
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    
    if (currentElement.current) {
      onCanvasDataChange({
        ...canvasData,
        elements: [...canvasData.elements, currentElement.current],
      });
      currentElement.current = null;
    }
    
    lastPoint.current = null;
  }, [canvasData, onCanvasDataChange]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    redrawCanvas,
  };
}
