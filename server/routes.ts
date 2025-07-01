import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompetitionSchema, insertPitMapSchema, insertTeamAssignmentSchema } from "@shared/schema";
import { z } from "zod";

const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";
const TBA_AUTH_KEY = process.env.TBA_AUTH_KEY || process.env.THE_BLUE_ALLIANCE_API_KEY || "";

async function fetchFromTBA(endpoint: string) {
  if (!TBA_AUTH_KEY) {
    throw new Error("TBA_AUTH_KEY is required");
  }

  const response = await fetch(`${TBA_BASE_URL}${endpoint}`, {
    headers: {
      "X-TBA-Auth-Key": TBA_AUTH_KEY,
      "User-Agent": "FRC-PitMap-App/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`TBA API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get competitions from TBA API by year
  app.get("/api/competitions/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year) || year < 1992 || year > new Date().getFullYear() + 1) {
        return res.status(400).json({ message: "Invalid year" });
      }

      // First check if we have cached competitions
      const cachedCompetitions = await storage.getCompetitions(year);
      if (cachedCompetitions.length > 0) {
        return res.json(cachedCompetitions);
      }

      // Fetch from TBA API
      const tbaEvents = await fetchFromTBA(`/events/${year}`);
      
      // Transform TBA data to our schema
      const competitions = tbaEvents.map((event: any) => ({
        key: event.key,
        name: event.name,
        eventCode: event.event_code,
        eventType: event.event_type,
        district: event.district?.key || null,
        city: event.city,
        stateProv: event.state_prov,
        country: event.country,
        startDate: event.start_date,
        endDate: event.end_date,
        year: event.year,
        teamCount: 0, // Will be updated when teams are fetched
        eventTypeString: event.event_type_string,
        website: event.website,
        firstEventId: event.first_event_id,
        firstEventCode: event.first_event_code,
        webcasts: event.webcasts,
        divisionKeys: event.division_keys,
        parentEventKey: event.parent_event_key,
        playoffType: event.playoff_type,
        playoffTypeString: event.playoff_type_string,
      }));

      // Save to storage
      const savedCompetitions = await storage.createCompetitions(competitions);
      res.json(savedCompetitions);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Failed to fetch competitions" });
    }
  });

  // Search competitions by location
  app.get("/api/competitions/:year/search", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const { location } = req.query;

      if (isNaN(year)) {
        return res.status(400).json({ message: "Invalid year" });
      }

      const competitions = await storage.getCompetitions(year);
      
      if (!location || typeof location !== 'string') {
        return res.json(competitions);
      }

      const filtered = competitions.filter(comp => {
        const searchTerm = location.toLowerCase();
        return (
          comp.city?.toLowerCase().includes(searchTerm) ||
          comp.stateProv?.toLowerCase().includes(searchTerm) ||
          comp.country?.toLowerCase().includes(searchTerm) ||
          comp.name.toLowerCase().includes(searchTerm)
        );
      });

      res.json(filtered);
    } catch (error) {
      console.error("Error searching competitions:", error);
      res.status(500).json({ message: "Failed to search competitions" });
    }
  });

  // Get competition details with teams
  app.get("/api/competitions/:key/details", async (req, res) => {
    try {
      const { key } = req.params;
      
      const competition = await storage.getCompetitionByKey(key);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // Fetch teams from TBA API
      try {
        const teams = await fetchFromTBA(`/event/${key}/teams/simple`);
        competition.teamCount = teams.length;
      } catch (error) {
        console.error("Error fetching teams for competition:", error);
      }

      res.json(competition);
    } catch (error) {
      console.error("Error fetching competition details:", error);
      res.status(500).json({ message: "Failed to fetch competition details" });
    }
  });

  // Get all pit maps
  app.get("/api/pit-maps", async (req, res) => {
    try {
      const pitMaps = await storage.getPitMaps();
      res.json(pitMaps);
    } catch (error) {
      console.error("Error fetching pit maps:", error);
      res.status(500).json({ message: "Failed to fetch pit maps" });
    }
  });

  // Get pit maps for a specific competition
  app.get("/api/pit-maps/competition/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const pitMaps = await storage.getPitMapsByCompetition(key);
      res.json(pitMaps);
    } catch (error) {
      console.error("Error fetching pit maps for competition:", error);
      res.status(500).json({ message: "Failed to fetch pit maps" });
    }
  });

  // Create a new pit map
  app.post("/api/pit-maps", async (req, res) => {
    try {
      const validatedData = insertPitMapSchema.parse(req.body);
      const pitMap = await storage.createPitMap(validatedData);
      res.status(201).json(pitMap);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating pit map:", error);
      res.status(500).json({ message: "Failed to create pit map" });
    }
  });

  // Update a pit map
  app.put("/api/pit-maps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pit map ID" });
      }

      const validatedData = insertPitMapSchema.partial().parse(req.body);
      const pitMap = await storage.updatePitMap(id, validatedData);
      
      if (!pitMap) {
        return res.status(404).json({ message: "Pit map not found" });
      }

      res.json(pitMap);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating pit map:", error);
      res.status(500).json({ message: "Failed to update pit map" });
    }
  });

  // Delete a pit map
  app.delete("/api/pit-maps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pit map ID" });
      }

      const deleted = await storage.deletePitMap(id);
      if (!deleted) {
        return res.status(404).json({ message: "Pit map not found" });
      }

      res.json({ message: "Pit map deleted successfully" });
    } catch (error) {
      console.error("Error deleting pit map:", error);
      res.status(500).json({ message: "Failed to delete pit map" });
    }
  });

  // Get team assignments for a pit map
  app.get("/api/pit-maps/:id/assignments", async (req, res) => {
    try {
      const pitMapId = parseInt(req.params.id);
      if (isNaN(pitMapId)) {
        return res.status(400).json({ message: "Invalid pit map ID" });
      }

      const assignments = await storage.getTeamAssignments(pitMapId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching team assignments:", error);
      res.status(500).json({ message: "Failed to fetch team assignments" });
    }
  });

  // Create a team assignment
  app.post("/api/team-assignments", async (req, res) => {
    try {
      const validatedData = insertTeamAssignmentSchema.parse(req.body);
      const assignment = await storage.createTeamAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating team assignment:", error);
      res.status(500).json({ message: "Failed to create team assignment" });
    }
  });

  // Delete a team assignment
  app.delete("/api/team-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team assignment ID" });
      }

      const deleted = await storage.deleteTeamAssignment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Team assignment not found" });
      }

      res.json({ message: "Team assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting team assignment:", error);
      res.status(500).json({ message: "Failed to delete team assignment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
