import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  eventCode: text("event_code"),
  eventType: integer("event_type"),
  district: text("district"),
  city: text("city"),
  stateProv: text("state_prov"),
  country: text("country"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  year: integer("year").notNull(),
  teamCount: integer("team_count"),
  eventTypeString: text("event_type_string"),
  website: text("website"),
  firstEventId: text("first_event_id"),
  firstEventCode: text("first_event_code"),
  webcasts: json("webcasts"),
  divisionKeys: json("division_keys"),
  parentEventKey: text("parent_event_key"),
  playoffType: integer("playoff_type"),
  playoffTypeString: text("playoff_type_string"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pitMaps = pgTable("pit_maps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  competitionKey: text("competition_key").notNull(),
  competitionName: text("competition_name").notNull(),
  canvasData: json("canvas_data").notNull(),
  teamAssignments: json("team_assignments").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamAssignments = pgTable("team_assignments", {
  id: serial("id").primaryKey(),
  pitMapId: integer("pit_map_id").notNull(),
  teamNumber: integer("team_number").notNull(),
  pitLocation: text("pit_location").notNull(),
  x: integer("x"),
  y: integer("y"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
});

export const insertPitMapSchema = createInsertSchema(pitMaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamAssignmentSchema = createInsertSchema(teamAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Competition = typeof competitions.$inferSelect;

export type InsertPitMap = z.infer<typeof insertPitMapSchema>;
export type PitMap = typeof pitMaps.$inferSelect;

export type InsertTeamAssignment = z.infer<typeof insertTeamAssignmentSchema>;
export type TeamAssignment = typeof teamAssignments.$inferSelect;

// Canvas drawing types
export const drawingElementSchema = z.object({
  id: z.string(),
  type: z.enum(['line', 'pit', 'text']),
  startX: z.number(),
  startY: z.number(),
  endX: z.number().optional(),
  endY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  text: z.string().optional(),
  teamNumber: z.number().optional(),
  color: z.string().default('#1976D2'),
  strokeWidth: z.number().default(2),
});

export type DrawingElement = z.infer<typeof drawingElementSchema>;

export const canvasDataSchema = z.object({
  elements: z.array(drawingElementSchema),
  zoom: z.number().default(1),
  panX: z.number().default(0),
  panY: z.number().default(0),
});

export type CanvasData = z.infer<typeof canvasDataSchema>;
