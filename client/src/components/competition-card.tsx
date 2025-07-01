import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Info, Calendar, MapPin, Users } from "lucide-react";
import type { Competition } from "@shared/schema";

interface CompetitionCardProps {
  competition: Competition;
  onCreatePitMap: (competition: Competition) => void;
}

export default function CompetitionCard({ competition, onCreatePitMap }: CompetitionCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return { status: "Upcoming", color: "bg-green-100 text-green-800" };
    } else if (now >= start && now <= end) {
      return { status: "In Progress", color: "bg-blue-100 text-blue-800" };
    } else {
      return { status: "Completed", color: "bg-gray-100 text-gray-800" };
    }
  };

  const eventStatus = getEventStatus(competition.startDate, competition.endDate);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-frc-gray line-clamp-2">
            {competition.name}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {competition.city}, {competition.stateProv}, {competition.country}
          </div>
        </div>
        <Badge className={eventStatus.color}>
          {eventStatus.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
          <div className="flex items-center text-sm font-medium">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(competition.startDate)}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
          <div className="flex items-center text-sm font-medium">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(competition.endDate)}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Teams</p>
          <div className="flex items-center text-sm font-medium">
            <Users className="h-3 w-3 mr-1" />
            {competition.teamCount || 'TBD'}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Event Type</p>
          <p className="text-sm font-medium">
            {competition.eventTypeString || 'Competition'}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          className="flex-1 bg-frc-blue hover:bg-frc-blue-dark"
          onClick={() => onCreatePitMap(competition)}
        >
          <Map className="h-4 w-4 mr-2" />
          Create Pit Map
        </Button>
        <Button 
          variant="outline"
          className="flex-1 border-frc-blue text-frc-blue hover:bg-frc-blue hover:text-white"
          onClick={() => {
            if (competition.website) {
              window.open(competition.website, '_blank');
            }
          }}
          disabled={!competition.website}
        >
          <Info className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  );
}
