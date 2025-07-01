import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CompetitionSearch from "@/components/competition-search";
import CompetitionCard from "@/components/competition-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { Competition } from "@shared/schema";

export default function Competitions() {
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState<{
    year: number;
    location?: string;
  }>({ year: new Date().getFullYear() });

  const { 
    data: competitions, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Competition[]>({
    queryKey: ['/api/competitions', searchParams.year, searchParams.location],
    queryFn: () => {
      const url = searchParams.location 
        ? `/api/competitions/${searchParams.year}/search?location=${encodeURIComponent(searchParams.location)}`
        : `/api/competitions/${searchParams.year}`;
      return fetch(url).then(res => res.json());
    },
    enabled: !!searchParams.year,
  });

  const handleSearch = (year: number, location?: string) => {
    setSearchParams({ year, location });
  };

  const handleCreatePitMap = (competition: Competition) => {
    setLocation(`/pit-map/${competition.key}`);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <CompetitionSearch onSearch={handleSearch} />
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900">
                Failed to Load Competitions
              </h3>
              <p className="text-gray-600">
                Unable to fetch competition data. Please check your internet connection and try again.
              </p>
              <Button onClick={() => refetch()} className="bg-frc-blue hover:bg-frc-blue-dark">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Find FRC Competitions</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitionSearch onSearch={handleSearch} />
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {searchParams.location 
                ? `Competitions in ${searchParams.location} (${searchParams.year})`
                : `${searchParams.year} Competitions`
              }
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                    <div className="flex gap-3">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : competitions && competitions.length > 0 ? (
            <div className="space-y-4">
              {competitions.map((competition) => (
                <CompetitionCard
                  key={competition.key}
                  competition={competition}
                  onCreatePitMap={handleCreatePitMap}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Competitions Found
              </h3>
              <p className="text-gray-500">
                {searchParams.location
                  ? `No competitions found in ${searchParams.location} for ${searchParams.year}.`
                  : `No competitions found for ${searchParams.year}.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
