import { useCallback, useRef } from "react";

interface UseTouchEventsProps {
  onStart: (event: MouseEvent) => void;
  onMove: (event: MouseEvent) => void;
  onEnd: (event: MouseEvent) => void;
}

export function useTouchEvents({ onStart, onMove, onEnd }: UseTouchEventsProps) {
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);

  const convertTouchToMouse = useCallback((touch: Touch, type: string): MouseEvent => {
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: touch.target,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as MouseEvent;
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    const touches = event.touches;
    
    if (touches.length === 1) {
      // Single touch - drawing
      const touch = touches[0];
      const mouseEvent = convertTouchToMouse(touch, 'mousedown');
      lastTouchRef.current = { 
        x: touch.clientX, 
        y: touch.clientY, 
        time: Date.now() 
      };
      onStart(mouseEvent);
    } else if (touches.length === 2) {
      // Two finger pinch - zoom
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      pinchDistanceRef.current = distance;
    }
  }, [onStart, convertTouchToMouse]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    const touches = event.touches;
    
    if (touches.length === 1 && lastTouchRef.current) {
      // Single touch - drawing
      const touch = touches[0];
      const mouseEvent = convertTouchToMouse(touch, 'mousemove');
      onMove(mouseEvent);
    } else if (touches.length === 2 && pinchDistanceRef.current) {
      // Two finger pinch - zoom
      const touch1 = touches[0];
      const touch2 = touches[1];
      const newDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = newDistance / pinchDistanceRef.current;
      
      // TODO: Implement zoom functionality
      // This would need to be passed up to the canvas component
      console.log('Pinch scale:', scale);
      
      pinchDistanceRef.current = newDistance;
    }
  }, [onMove, convertTouchToMouse]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 0) {
      // All touches ended
      if (lastTouchRef.current) {
        const dummyEvent = {
          clientX: lastTouchRef.current.x,
          clientY: lastTouchRef.current.y,
          target: event.target,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as MouseEvent;
        
        onEnd(dummyEvent);
        lastTouchRef.current = null;
      }
      pinchDistanceRef.current = null;
    } else if (event.touches.length === 1) {
      // One finger remains, reset pinch
      pinchDistanceRef.current = null;
    }
  }, [onEnd]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
