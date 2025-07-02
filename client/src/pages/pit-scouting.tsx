import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { PitMap, CanvasData, DrawingElement } from "@shared/schema";
import PitScoutingCanvas from "@/components/pit-scouting-canvas";

export default function PitScouting() {
  const [, setLocation] = useLocation();
  const [selectedPitMap, setSelectedPitMap] = useState<PitMap | null>(null);
  const [pitStatuses, setPitStatuses] = useState<Record<string, 'not-visited' | 'done' | 'absent'>>({});
  const [selectedPit, setSelectedPit] = useState<{id: string, teamNumber: number} | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const { data: pitMaps, isLoading } = useQuery({
    queryKey: ['/api/pit-maps'],
  });

  // Initialize pit statuses when a pit map is selected
  useEffect(() => {
    if (selectedPitMap && selectedPitMap.canvasData) {
      const initialStatuses: Record<string, 'not-visited' | 'done' | 'absent'> = {};
      const canvasData = selectedPitMap.canvasData as CanvasData;
      
      canvasData.elements.forEach((element: DrawingElement) => {
        if (element.type === 'pit' && element.teamNumber) {
          initialStatuses[element.id] = 'not-visited';
        }
      });
      
      setPitStatuses(initialStatuses);
    }
  }, [selectedPitMap]);

  const handlePitClick = (pitId: string, teamNumber: number, newStatus?: 'done' | 'absent') => {
    if (newStatus) {
      // Direct status change from hold-and-drag gesture
      setPitStatuses(prev => ({
        ...prev,
        [pitId]: newStatus
      }));
    } else {
      // Fallback to dialog for simple clicks
      setSelectedPit({ id: pitId, teamNumber });
      setShowStatusDialog(true);
    }
  };

  const handleStatusChange = (status: 'done' | 'absent') => {
    if (selectedPit) {
      setPitStatuses(prev => ({
        ...prev,
        [selectedPit.id]: status
      }));
    }
    setShowStatusDialog(false);
    setSelectedPit(null);
  };

  const getStatusColor = (status: 'not-visited' | 'done' | 'absent') => {
    switch (status) {
      case 'not-visited': return '#ef4444'; // red
      case 'done': return '#22c55e'; // green
      case 'absent': return '#eab308'; // yellow
    }
  };

  const getStatusStats = () => {
    const total = Object.keys(pitStatuses).length;
    const done = Object.values(pitStatuses).filter(s => s === 'done').length;
    const absent = Object.values(pitStatuses).filter(s => s === 'absent').length;
    const notVisited = Object.values(pitStatuses).filter(s => s === 'not-visited').length;
    
    return { total, done, absent, notVisited };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading pit maps...</div>
      </div>
    );
  }

  if (!selectedPitMap) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pit Scouting</h1>
          <p className="text-gray-600">Select a saved pit map to start scouting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(pitMaps) && pitMaps.map((pitMap: PitMap) => {
            const canvasData = pitMap.canvasData as CanvasData;
            const teamCount = canvasData?.elements?.filter((e: DrawingElement) => e.type === 'pit' && e.teamNumber).length || 0;
            
            return (
              <Card key={pitMap.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{pitMap.name}</CardTitle>
                  <CardDescription>{pitMap.competitionName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Competition: {pitMap.competitionKey}
                    </div>
                    <div className="text-sm text-gray-600">
                      Teams: {teamCount}
                    </div>
                    <Button 
                      onClick={() => setSelectedPitMap(pitMap)}
                      className="w-full mt-4"
                    >
                      Start Scouting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(!pitMaps || !Array.isArray(pitMaps) || pitMaps.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No saved pit maps found</p>
            <Button onClick={() => setLocation('/competitions')}>
              Create a Pit Map
            </Button>
          </div>
        )}
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedPitMap(null)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Maps</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Scouting: {selectedPitMap.name}
        </h1>
        <p className="text-gray-600">{selectedPitMap.competitionName}</p>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Pits</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.done}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{stats.absent}</div>
          <div className="text-sm text-gray-600">Absent</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.notVisited}</div>
          <div className="text-sm text-gray-600">Not Visited</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Badge variant="outline" className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Not Visited</span>
        </Badge>
        <Badge variant="outline" className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Done</span>
        </Badge>
        <Badge variant="outline" className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Absent</span>
        </Badge>
      </div>

      {/* Canvas */}
      <div className="bg-white rounded-lg border p-4">
        <PitScoutingCanvas
          canvasData={selectedPitMap.canvasData as CanvasData}
          pitStatuses={pitStatuses}
          onPitClick={handlePitClick}
          getStatusColor={getStatusColor}
        />
      </div>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Pit Status</DialogTitle>
            <DialogDescription>
              {selectedPit && `Set status for Team ${selectedPit.teamNumber}`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => handleStatusChange('done')}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Done</span>
            </Button>
            <Button
              onClick={() => handleStatusChange('absent')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Absent</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              className="flex items-center space-x-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}