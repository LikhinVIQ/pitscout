import type { DrawingElement } from "@shared/schema";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getElementBounds(element: DrawingElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  switch (element.type) {
    case 'line':
      const minX = Math.min(element.startX, element.endX || element.startX);
      const maxX = Math.max(element.startX, element.endX || element.startX);
      const minY = Math.min(element.startY, element.endY || element.startY);
      const maxY = Math.max(element.startY, element.endY || element.startY);
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
      
    case 'pit':
      return {
        x: element.startX,
        y: element.startY,
        width: element.width || 0,
        height: element.height || 0,
      };
      
    case 'text':
      // Approximate text bounds
      const textWidth = (element.text?.length || 0) * 8; // Rough estimate
      return {
        x: element.startX,
        y: element.startY - 16, // Font height
        width: textWidth,
        height: 16,
      };
      
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

export function isPointInElement(
  x: number, 
  y: number, 
  element: DrawingElement,
  tolerance: number = 5
): boolean {
  const bounds = getElementBounds(element);
  
  return (
    x >= bounds.x - tolerance &&
    x <= bounds.x + bounds.width + tolerance &&
    y >= bounds.y - tolerance &&
    y <= bounds.y + bounds.height + tolerance
  );
}

export function snapToGrid(value: number, gridSize: number = 20): number {
  return Math.round(value / gridSize) * gridSize;
}

export function calculateDistance(
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function exportCanvasAsImage(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string = 'pit-map.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = exportCanvasAsImage(canvas);
  link.click();
}
