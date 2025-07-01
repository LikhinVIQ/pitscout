import type { PitMap, CanvasData } from "@shared/schema";

const STORAGE_KEYS = {
  PIT_MAPS: 'frc-pit-maps',
  SETTINGS: 'frc-pit-map-settings',
} as const;

export interface StoredPitMap {
  id: string;
  name: string;
  competitionKey: string;
  competitionName: string;
  canvasData: CanvasData;
  teamAssignments: Array<{
    teamNumber: number;
    pitLocation: string;
    x?: number;
    y?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function savePitMapLocally(pitMap: Omit<StoredPitMap, 'id' | 'createdAt' | 'updatedAt'>): StoredPitMap {
  const existingMaps = getLocalPitMaps();
  const id = generateLocalId();
  const now = new Date().toISOString();
  
  const newPitMap: StoredPitMap = {
    ...pitMap,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  const updatedMaps = [...existingMaps, newPitMap];
  localStorage.setItem(STORAGE_KEYS.PIT_MAPS, JSON.stringify(updatedMaps));
  
  return newPitMap;
}

export function updatePitMapLocally(id: string, updates: Partial<StoredPitMap>): StoredPitMap | null {
  const existingMaps = getLocalPitMaps();
  const mapIndex = existingMaps.findIndex(map => map.id === id);
  
  if (mapIndex === -1) return null;
  
  const updatedMap: StoredPitMap = {
    ...existingMaps[mapIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  existingMaps[mapIndex] = updatedMap;
  localStorage.setItem(STORAGE_KEYS.PIT_MAPS, JSON.stringify(existingMaps));
  
  return updatedMap;
}

export function getLocalPitMaps(): StoredPitMap[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PIT_MAPS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading pit maps from localStorage:', error);
    return [];
  }
}

export function getLocalPitMap(id: string): StoredPitMap | null {
  const maps = getLocalPitMaps();
  return maps.find(map => map.id === id) || null;
}

export function deleteLocalPitMap(id: string): boolean {
  const existingMaps = getLocalPitMaps();
  const filteredMaps = existingMaps.filter(map => map.id !== id);
  
  if (filteredMaps.length === existingMaps.length) {
    return false; // Map not found
  }
  
  localStorage.setItem(STORAGE_KEYS.PIT_MAPS, JSON.stringify(filteredMaps));
  return true;
}

export function exportPitMap(pitMap: StoredPitMap): string {
  return JSON.stringify(pitMap, null, 2);
}

export function importPitMap(jsonString: string): StoredPitMap | null {
  try {
    const pitMap = JSON.parse(jsonString) as StoredPitMap;
    
    // Validate the structure
    if (!pitMap.name || !pitMap.canvasData || !pitMap.competitionKey) {
      throw new Error('Invalid pit map format');
    }
    
    // Generate new ID to avoid conflicts
    return savePitMapLocally({
      name: `${pitMap.name} (Imported)`,
      competitionKey: pitMap.competitionKey,
      competitionName: pitMap.competitionName,
      canvasData: pitMap.canvasData,
      teamAssignments: pitMap.teamAssignments || [],
    });
  } catch (error) {
    console.error('Error importing pit map:', error);
    return null;
  }
}

function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Settings management
export interface AppSettings {
  defaultZoom: number;
  gridSize: number;
  autoSave: boolean;
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultZoom: 1,
  gridSize: 20,
  autoSave: true,
  defaultStrokeColor: '#1976D2',
  defaultStrokeWidth: 2,
};

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PIT_MAPS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
