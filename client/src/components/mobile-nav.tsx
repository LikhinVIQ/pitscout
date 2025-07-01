import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Map, Bookmark, Plus } from "lucide-react";

export default function MobileNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Search, label: "Search" },
    { path: "/competitions", icon: Calendar, label: "Events" },
    { path: "/pit-map", icon: Map, label: "Pit Map" },
    { path: "/saved-maps", icon: Bookmark, label: "Saved" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={`flex flex-col items-center py-2 px-3 min-h-[60px] ${
                isActive(item.path)
                  ? "text-frc-blue mobile-nav-active"
                  : "text-gray-500 mobile-nav-inactive"
              }`}
              onClick={() => setLocation(item.path)}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 md:bottom-6 z-30">
        <Button
          className="bg-frc-orange hover:bg-orange-600 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => setLocation("/pit-map")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
