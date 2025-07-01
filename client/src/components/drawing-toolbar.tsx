import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Square, Type, Eraser, Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { CanvasData } from "@shared/schema";

interface DrawingToolbarProps {
  selectedTool: 'line' | 'pit' | 'text' | 'eraser';
  onToolChange: (tool: 'line' | 'pit' | 'text' | 'eraser') => void;
  onClearCanvas: () => void;
  canvasData: CanvasData;
  onCanvasDataChange: (data: CanvasData) => void;
}

export default function DrawingToolbar({ 
  selectedTool, 
  onToolChange, 
  onClearCanvas,
  canvasData,
  onCanvasDataChange
}: DrawingToolbarProps) {
  const tools = [
    { id: 'line' as const, icon: Minus, label: 'Line' },
    { id: 'pit' as const, icon: Square, label: 'Pit' },
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'eraser' as const, icon: Eraser, label: 'Eraser' },
  ];

  const handleZoomIn = () => {
    const newZoom = Math.min(canvasData.zoom * 1.2, 3);
    onCanvasDataChange({ ...canvasData, zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(canvasData.zoom / 1.2, 0.5);
    onCanvasDataChange({ ...canvasData, zoom: newZoom });
  };

  const handleResetView = () => {
    onCanvasDataChange({ 
      ...canvasData, 
      zoom: 1, 
      panX: 0, 
      panY: 0 
    });
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the pit map?')) {
      onClearCanvas();
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex flex-wrap gap-3 justify-center md:justify-start items-center">
        {/* Drawing Tools */}
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={selectedTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(tool.id)}
            className={`flex items-center space-x-2 touch-target ${
              selectedTool === tool.id
                ? 'bg-frc-blue hover:bg-frc-blue-dark text-white'
                : 'hover:bg-gray-200'
            }`}
          >
            <tool.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tool.label}</span>
          </Button>
        ))}

        <Separator orientation="vertical" className="h-8 mx-2" />

        {/* View Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="touch-target"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="touch-target"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetView}
            className="touch-target"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2" />

        {/* Action Buttons */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClear}
          className="flex items-center space-x-2 touch-target"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      </div>
    </div>
  );
}
