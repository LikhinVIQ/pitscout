import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Competitions from "@/pages/competitions";
import PitMap from "@/pages/pit-map";
import SavedMaps from "@/pages/saved-maps";
import MobileNav from "@/components/mobile-nav";
import { Bot } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/competitions" component={Competitions} />
      <Route path="/pit-map/:competitionKey?" component={PitMap} />
      <Route path="/saved-maps" component={SavedMaps} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-frc-light">
          {/* Header */}
          <header className="bg-frc-blue text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <Bot className="h-8 w-8" />
                  <h1 className="text-xl font-bold">FRC Pit Map</h1>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
            <Router />
          </main>

          {/* Mobile Navigation */}
          <MobileNav />
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
