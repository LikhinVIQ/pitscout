import { competitions, pitMaps, teamAssignments, type Competition, type InsertCompetition, type PitMap, type InsertPitMap, type TeamAssignment, type InsertTeamAssignment } from "@shared/schema";

export interface IStorage {
  // Competition methods
  getCompetitions(year?: number): Promise<Competition[]>;
  getCompetitionByKey(key: string): Promise<Competition | undefined>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  createCompetitions(competitions: InsertCompetition[]): Promise<Competition[]>;
  
  // Pit map methods
  getPitMaps(): Promise<PitMap[]>;
  getPitMapById(id: number): Promise<PitMap | undefined>;
  getPitMapsByCompetition(competitionKey: string): Promise<PitMap[]>;
  createPitMap(pitMap: InsertPitMap): Promise<PitMap>;
  updatePitMap(id: number, pitMap: Partial<InsertPitMap>): Promise<PitMap | undefined>;
  deletePitMap(id: number): Promise<boolean>;
  
  // Team assignment methods
  getTeamAssignments(pitMapId: number): Promise<TeamAssignment[]>;
  createTeamAssignment(assignment: InsertTeamAssignment): Promise<TeamAssignment>;
  deleteTeamAssignment(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private competitions: Map<string, Competition>;
  private pitMaps: Map<number, PitMap>;
  private teamAssignments: Map<number, TeamAssignment>;
  private currentCompetitionId: number;
  private currentPitMapId: number;
  private currentTeamAssignmentId: number;

  constructor() {
    this.competitions = new Map();
    this.pitMaps = new Map();
    this.teamAssignments = new Map();
    this.currentCompetitionId = 1;
    this.currentPitMapId = 1;
    this.currentTeamAssignmentId = 1;
  }

  async getCompetitions(year?: number): Promise<Competition[]> {
    const allCompetitions = Array.from(this.competitions.values());
    if (year) {
      return allCompetitions.filter(comp => comp.year === year);
    }
    return allCompetitions;
  }

  async getCompetitionByKey(key: string): Promise<Competition | undefined> {
    return this.competitions.get(key);
  }

  async createCompetition(insertCompetition: InsertCompetition): Promise<Competition> {
    const id = this.currentCompetitionId++;
    const competition: Competition = {
      id,
      key: insertCompetition.key,
      name: insertCompetition.name,
      eventCode: insertCompetition.eventCode || null,
      eventType: insertCompetition.eventType || null,
      district: insertCompetition.district || null,
      city: insertCompetition.city || null,
      stateProv: insertCompetition.stateProv || null,
      country: insertCompetition.country || null,
      startDate: insertCompetition.startDate || null,
      endDate: insertCompetition.endDate || null,
      year: insertCompetition.year,
      teamCount: insertCompetition.teamCount || null,
      eventTypeString: insertCompetition.eventTypeString || null,
      website: insertCompetition.website || null,
      firstEventId: insertCompetition.firstEventId || null,
      firstEventCode: insertCompetition.firstEventCode || null,
      webcasts: insertCompetition.webcasts || null,
      divisionKeys: insertCompetition.divisionKeys || null,
      parentEventKey: insertCompetition.parentEventKey || null,
      playoffType: insertCompetition.playoffType || null,
      playoffTypeString: insertCompetition.playoffTypeString || null,
      createdAt: new Date(),
    };
    this.competitions.set(competition.key, competition);
    return competition;
  }

  async createCompetitions(insertCompetitions: InsertCompetition[]): Promise<Competition[]> {
    const results: Competition[] = [];
    for (const insertComp of insertCompetitions) {
      const existing = this.competitions.get(insertComp.key);
      if (!existing) {
        const competition = await this.createCompetition(insertComp);
        results.push(competition);
      } else {
        results.push(existing);
      }
    }
    return results;
  }

  async getPitMaps(): Promise<PitMap[]> {
    return Array.from(this.pitMaps.values());
  }

  async getPitMapById(id: number): Promise<PitMap | undefined> {
    return this.pitMaps.get(id);
  }

  async getPitMapsByCompetition(competitionKey: string): Promise<PitMap[]> {
    return Array.from(this.pitMaps.values()).filter(
      (pitMap) => pitMap.competitionKey === competitionKey
    );
  }

  async createPitMap(insertPitMap: InsertPitMap): Promise<PitMap> {
    const id = this.currentPitMapId++;
    const now = new Date();
    const pitMap: PitMap = {
      ...insertPitMap,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.pitMaps.set(id, pitMap);
    return pitMap;
  }

  async updatePitMap(id: number, updateData: Partial<InsertPitMap>): Promise<PitMap | undefined> {
    const existing = this.pitMaps.get(id);
    if (!existing) return undefined;

    const updated: PitMap = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.pitMaps.set(id, updated);
    return updated;
  }

  async deletePitMap(id: number): Promise<boolean> {
    return this.pitMaps.delete(id);
  }

  async getTeamAssignments(pitMapId: number): Promise<TeamAssignment[]> {
    return Array.from(this.teamAssignments.values()).filter(
      (assignment) => assignment.pitMapId === pitMapId
    );
  }

  async createTeamAssignment(insertAssignment: InsertTeamAssignment): Promise<TeamAssignment> {
    const id = this.currentTeamAssignmentId++;
    const assignment: TeamAssignment = {
      id,
      pitMapId: insertAssignment.pitMapId,
      teamNumber: insertAssignment.teamNumber,
      pitLocation: insertAssignment.pitLocation,
      x: insertAssignment.x || null,
      y: insertAssignment.y || null,
      createdAt: new Date(),
    };
    this.teamAssignments.set(id, assignment);
    return assignment;
  }

  async deleteTeamAssignment(id: number): Promise<boolean> {
    return this.teamAssignments.delete(id);
  }
}

export const storage = new MemStorage();
