import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Trash2, Map, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { PitMap } from "@shared/schema";

export default function SavedMaps() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pitMaps, isLoading, error } = useQuery<PitMap[]>({
    queryKey: ['/api/pit-maps'],
    queryFn: () => fetch('/api/pit-maps').then(res => res.json()),
  });

  const deletePitMapMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/pit-maps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pit-maps'] });
      toast({
        title: "Pit map deleted",
        description: "The pit map has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete pit map. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLoadPitMap = (pitMap: PitMap) => {
    setLocation(`/pit-map/${pitMap.competitionKey}`);
  };

  const handleDeletePitMap = (pitMap: PitMap) => {
    if (window.confirm(`Are you sure you want to delete "${pitMap.name}"?`)) {
      deletePitMapMutation.mutate(pitMap.id);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to Load Saved Maps
            </h3>
            <p className="text-gray-600">
              Unable to fetch your saved pit maps. Please try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Saved Pit Maps</CardTitle>
            <Button 
              onClick={() => setLocation('/pit-map')}
              className="bg-frc-blue hover:bg-frc-blue-dark"
            >
              <Map className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-32 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 w-10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pitMaps && pitMaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pitMaps.map((pitMap) => (
                <div key={pitMap.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-frc-gray line-clamp-2">
                      {pitMap.competitionName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Last modified: {formatDate(pitMap.updatedAt)}
                    </p>
                  </div>
                  
                  {/* Canvas Preview */}
                  <div className="bg-gray-100 rounded-md h-32 mb-4 flex items-center justify-center">
                    <Map className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500 ml-2">
                      {Array.isArray(pitMap.canvasData) ? 
                        (pitMap.canvasData as any[]).length : 
                        (pitMap.canvasData as any)?.elements?.length || 0
                      } elements
                    </span>
                  </div>
                  
                  {/* Team Count */}
                  <div className="text-sm text-gray-600 mb-4">
                    {Array.isArray(pitMap.teamAssignments) ?
                      pitMap.teamAssignments.length :
                      0
                    } team assignments
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-frc-blue hover:bg-frc-blue-dark"
                      onClick={() => handleLoadPitMap(pitMap)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePitMap(pitMap)}
                      disabled={deletePitMapMutation.isPending}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Saved Pit Maps
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't saved any pit maps yet. Create your first pit map to get started.
              </p>
              <Button 
                onClick={() => setLocation('/pit-map')}
                className="bg-frc-blue hover:bg-frc-blue-dark"
              >
                <Map className="h-4 w-4 mr-2" />
                Create Your First Pit Map
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
