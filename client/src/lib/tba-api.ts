// Client-side utilities for TBA API data processing

export interface TBAEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district?: {
    abbreviation: string;
    display_name: string;
    key: string;
    year: number;
  };
  city: string;
  state_prov: string;
  country: string;
  start_date: string;
  end_date: string;
  year: number;
  short_name?: string;
  event_type_string: string;
  week?: number;
  address?: string;
  postal_code?: string;
  gmaps_place_id?: string;
  gmaps_url?: string;
  lat?: number;
  lng?: number;
  location_name?: string;
  timezone?: string;
  website?: string;
  first_event_id?: string;
  first_event_code?: string;
  webcasts?: Array<{
    type: string;
    channel: string;
    date?: string;
  }>;
  division_keys?: string[];
  parent_event_key?: string;
  playoff_type?: number;
  playoff_type_string?: string;
}

export interface TBATeam {
  key: string;
  team_number: number;
  nickname?: string;
  name: string;
  school_name?: string;
  city?: string;
  state_prov?: string;
  country?: string;
  address?: string;
  postal_code?: string;
  gmaps_place_id?: string;
  gmaps_url?: string;
  lat?: number;
  lng?: number;
  location_name?: string;
  website?: string;
  rookie_year?: number;
  motto?: string;
  home_championship?: Record<string, string>;
}

export function getEventStatus(startDate: string, endDate: string): {
  status: 'upcoming' | 'active' | 'completed';
  color: string;
} {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) {
    return { status: 'upcoming', color: 'bg-green-100 text-green-800' };
  } else if (now >= start && now <= end) {
    return { status: 'active', color: 'bg-blue-100 text-blue-800' };
  } else {
    return { status: 'completed', color: 'bg-gray-100 text-gray-800' };
  }
}

export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function sortEventsByDistance(
  events: TBAEvent[],
  userLat: number,
  userLon: number
): TBAEvent[] {
  return events
    .filter(event => event.lat && event.lng)
    .map(event => ({
      ...event,
      distance: calculateDistance(userLat, userLon, event.lat!, event.lng!),
    }))
    .sort((a, b) => a.distance - b.distance);
}

export function filterEventsByLocation(
  events: TBAEvent[],
  searchTerm: string
): TBAEvent[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return events;
  
  return events.filter(event => 
    event.city?.toLowerCase().includes(term) ||
    event.state_prov?.toLowerCase().includes(term) ||
    event.country?.toLowerCase().includes(term) ||
    event.name.toLowerCase().includes(term) ||
    event.district?.display_name?.toLowerCase().includes(term)
  );
}

export function getEventTypeColor(eventType: number): string {
  switch (eventType) {
    case 0: // Regional
      return 'bg-blue-100 text-blue-800';
    case 1: // District
      return 'bg-green-100 text-green-800';
    case 2: // District Championship
      return 'bg-yellow-100 text-yellow-800';
    case 3: // Championship Division
      return 'bg-purple-100 text-purple-800';
    case 4: // Championship Finals
      return 'bg-red-100 text-red-800';
    case 5: // District Championship Division
      return 'bg-orange-100 text-orange-800';
    case 6: // Festival of Champions
      return 'bg-pink-100 text-pink-800';
    case 99: // Offseason
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function validateTBAApiKey(apiKey: string): boolean {
  // Basic validation - TBA API keys are typically 64 characters long
  return apiKey.length >= 40 && /^[a-zA-Z0-9]+$/.test(apiKey);
}

export function buildTBAUrl(endpoint: string, params?: Record<string, string>): string {
  const base = 'https://www.thebluealliance.com/api/v3';
  const url = new URL(endpoint, base);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
}

// Geolocation utilities
export function getCurrentLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  });
}
