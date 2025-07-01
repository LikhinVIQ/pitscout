import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import PitMapCanvas from "@/components/pit-map-canvas";
import DrawingToolbar from "@/components/drawing-toolbar";
import { Save, FolderOpen, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Competition, PitMap, CanvasData, TeamAssignment } from "@shared/schema";

export default function PitMapPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const competitionKey = params.competitionKey;

  const [selectedTool, setSelectedTool] = useState<'line' | 'pit' | 'text' | 'eraser'>('line');
  const [canvasData, setCanvasData] = useState<CanvasData>({
    elements: [],
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const [teamNumber, setTeamNumber] = useState('');
  const [pitLocation, setPitLocation] = useState('');
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
  const [currentPitMapId, setCurrentPitMapId] = useState<number | null>(null);

  // Fetch competition details if key is provided
  const { data: competition, isLoading: loadingCompetition } = useQuery<Competition>({
    queryKey: ['/api/competitions', competitionKey, 'details'],
    queryFn: () => fetch(`/api/competitions/${competitionKey}/details`).then(res => res.json()),
    enabled: !!competitionKey,
  });

  // Save pit map mutation
  const savePitMapMutation = useMutation({
    mutationFn: async (data: { name: string; competitionKey: string; competitionName: string }) => {
      const pitMapData = {
        name: data.name,
        competitionKey: data.competitionKey,
        competitionName: data.competitionName,
        canvasData,
        teamAssignments: teamAssignments.map(assignment => ({
          teamNumber: assignment.teamNumber,
          pitLocation: assignment.pitLocation,
          x: assignment.x,
          y: assignment.y,
        })),
      };

      if (currentPitMapId) {
        return apiRequest('PUT', `/api/pit-maps/${currentPitMapId}`, pitMapData);
      } else {
        return apiRequest('POST', '/api/pit-maps', pitMapData);
      }
    },
    onSuccess: (response) => {
      if (!currentPitMapId) {
        response.json().then((pitMap: PitMap) => {
          setCurrentPitMapId(pitMap.id);
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/pit-maps'] });
      toast({
        title: "Pit map saved",
        description: "Your pit map has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save pit map. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add team assignment
  const handleAddTeamAssignment = () => {
    if (!teamNumber || !pitLocation) {
      toast({
        title: "Missing information",
        description: "Please enter both team number and pit location.",
        variant: "destructive",
      });
      return;
    }

    const teamNum = parseInt(teamNumber);
    if (isNaN(teamNum)) {
      toast({
        title: "Invalid team number",
        description: "Please enter a valid team number.",
        variant: "destructive",
      });
      return;
    }

    // Check if team is already assigned
    if (teamAssignments.find(assignment => assignment.teamNumber === teamNum)) {
      toast({
        title: "Team already assigned",
        description: `Team ${teamNum} is already assigned to a pit.`,
        variant: "destructive",
      });
      return;
    }

    const newAssignment: TeamAssignment = {
      id: Date.now(), // Temporary ID
      pitMapId: currentPitMapId || 0,
      teamNumber: teamNum,
      pitLocation,
      x: null,
      y: null,
      createdAt: new Date(),
    };

    setTeamAssignments(prev => [...prev, newAssignment]);
    setTeamNumber('');
    setPitLocation('');
    
    toast({
      title: "Team assigned",
      description: `Team ${teamNum} assigned to pit ${pitLocation}.`,
    });
  };

  // Remove team assignment
  const handleRemoveTeamAssignment = (assignmentId: number) => {
    setTeamAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
  };

  // Save pit map
  const handleSavePitMap = () => {
    if (!competition && !competitionKey) {
      toast({
        title: "No competition selected",
        description: "Please select a competition or create a new pit map.",
        variant: "destructive",
      });
      return;
    }

    const competitionName = competition?.name || competitionKey || 'Untitled Competition';
    const key = competitionKey || 'unknown';

    savePitMapMutation.mutate({
      name: `${competitionName} - Pit Map`,
      competitionKey: key,
      competitionName,
    });
  };

  // Clear canvas
  const handleClearCanvas = () => {
    setCanvasData({
      elements: [],
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  };

  if (competitionKey && loadingCompetition) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Pit Map Creator</CardTitle>
              {competition && (
                <p className="text-sm text-gray-600 mt-1">
                  {competition.name} - {competition.city}, {competition.stateProv}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSavePitMap}
                disabled={savePitMapMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {savePitMapMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Load
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Drawing Tools */}
      <Card>
        <CardContent className="pt-6">
          <DrawingToolbar
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            onClearCanvas={handleClearCanvas}
            canvasData={canvasData}
            onCanvasDataChange={setCanvasData}
          />
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <PitMapCanvas
            canvasData={canvasData}
            onCanvasDataChange={setCanvasData}
            selectedTool={selectedTool}
            teamAssignments={teamAssignments}
          />
        </CardContent>
      </Card>

      {/* Team Assignment Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Team Pit Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="teamNumber">Team Number</Label>
              <Input
                id="teamNumber"
                type="number"
                placeholder="e.g., 254"
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pitLocation">Pit Location</Label>
              <Input
                id="pitLocation"
                placeholder="e.g., A-12"
                value={pitLocation}
                onChange={(e) => setPitLocation(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAddTeamAssignment}
            className="bg-frc-orange hover:bg-orange-600 mb-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Team to Pit
          </Button>

          {/* Current Assignments */}
          {teamAssignments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assignments</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {teamAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                    <div>
                      <span className="font-medium text-frc-blue">Team {assignment.teamNumber}</span>
                      <span className="text-gray-600 ml-2">Pit {assignment.pitLocation}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTeamAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
