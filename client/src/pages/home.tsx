import { useLocation } from "wouter";
import CompetitionSearch from "@/components/competition-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Map, Search, Bookmark } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Search,
      title: "Find Competitions",
      description: "Search for FRC competitions by year and location using The Blue Alliance API",
      action: () => setLocation("/competitions"),
    },
    {
      icon: Map,
      title: "Create Pit Maps",
      description: "Design custom pit maps with drawing tools for better event organization",
      action: () => setLocation("/pit-map"),
    },
    {
      icon: Bookmark,
      title: "Save Your Work",
      description: "Save and manage your pit maps locally for easy access",
      action: () => setLocation("/saved-maps"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-frc-gray">
          FRC Pit Map Creator
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find nearby FRC competitions and create detailed pit maps with our mobile-friendly drawing tools
        </p>
      </div>

      {/* Quick Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Competition Search
          </CardTitle>
          <CardDescription>
            Find FRC competitions near you to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompetitionSearch />
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-frc-blue bg-opacity-10 p-3 rounded-full">
                  <feature.icon className="h-8 w-8 text-frc-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-frc-gray mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {feature.description}
                  </p>
                </div>
                <Button 
                  onClick={feature.action}
                  className="bg-frc-blue hover:bg-frc-blue-dark"
                >
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg" 
          className="bg-frc-blue hover:bg-frc-blue-dark"
          onClick={() => setLocation("/competitions")}
        >
          <Calendar className="h-5 w-5 mr-2" />
          Browse Competitions
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="border-frc-blue text-frc-blue hover:bg-frc-blue hover:text-white"
          onClick={() => setLocation("/pit-map")}
        >
          <Map className="h-5 w-5 mr-2" />
          Create Pit Map
        </Button>
      </div>
    </div>
  );
}
