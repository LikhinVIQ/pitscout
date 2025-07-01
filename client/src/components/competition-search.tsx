import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useLocation } from "wouter";

interface CompetitionSearchProps {
  onSearch?: (year: number, location?: string) => void;
}

export default function CompetitionSearch({ onSearch }: CompetitionSearchProps) {
  const [, setLocation] = useLocation();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [locationInput, setLocationInput] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleSearch = () => {
    const yearNum = parseInt(year);
    const trimmedLocation = locationInput.trim();
    
    if (onSearch) {
      onSearch(yearNum, trimmedLocation || undefined);
    } else {
      // Navigate to competitions page with search params
      const params = new URLSearchParams();
      params.set('year', yearNum.toString());
      if (trimmedLocation) {
        params.set('location', trimmedLocation);
      }
      setLocation(`/competitions?${params.toString()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearSelect">Competition Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="yearSelect">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="locationInput">Location (State/Country)</Label>
          <Input
            id="locationInput"
            type="text"
            placeholder="e.g., California, Ontario"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>

      <Button 
        onClick={handleSearch}
        className="w-full bg-frc-blue hover:bg-frc-blue-dark"
      >
        <Search className="h-4 w-4 mr-2" />
        Search Competitions
      </Button>
    </div>
  );
}
