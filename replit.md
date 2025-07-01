# FRC Pit Map Creator

## Overview

This is a full-stack web application for creating and managing FRC (First Robotics Competition) pit maps. The application allows users to search for FRC competitions, create custom pit maps using drawing tools, and manage their saved maps. It integrates with The Blue Alliance API to fetch competition data and provides a mobile-friendly interface with canvas-based drawing capabilities.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the client-side application
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with shadcn/ui components for styling
- **Canvas API** for drawing functionality with custom touch event handling

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with proper error handling middleware
- **In-memory storage** with interface-based architecture for easy database migration
- **The Blue Alliance (TBA) API** integration for fetching competition data
- **Session-based architecture** ready (connect-pg-simple middleware included)

### Key Design Decisions
- **Mobile-first approach**: Touch event handling, responsive design, and mobile navigation
- **Progressive Web App features**: Optimized for mobile usage patterns
- **Modular storage interface**: Easy to switch from memory storage to database later
- **Canvas-based drawing**: Custom implementation for precise drawing control
- **Component-based UI**: Reusable shadcn/ui components with consistent styling

## Key Components

### Frontend Components
- **Canvas Drawing System**: Custom canvas implementation with drawing tools (line, pit, text, eraser)
- **Competition Search**: Integration with TBA API for finding FRC events
- **Mobile Navigation**: Bottom navigation bar with floating action button
- **Pit Map Management**: Save, load, and delete pit maps locally and on server

### Backend Services
- **TBA API Service**: Fetches competition data with proper authentication
- **Storage Service**: Abstracted interface supporting both memory and future database implementations
- **Competition Management**: CRUD operations for competitions and pit maps
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Drawing Tools
- **Line Tool**: Draw straight lines for pit boundaries
- **Pit Tool**: Create rectangular pit areas
- **Text Tool**: Add labels and annotations
- **Eraser Tool**: Remove elements from the canvas
- **Zoom/Pan**: Canvas manipulation for detailed editing

## Data Flow

1. **Competition Search**: User searches by year → TBA API fetch → Cache in memory storage → Display results
2. **Pit Map Creation**: User selects competition → Create canvas → Draw elements → Save to storage
3. **Canvas Interaction**: Touch/mouse events → Convert to canvas coordinates → Update canvas data → Redraw
4. **Data Persistence**: Canvas state + team assignments → JSON storage → Server-side persistence

## External Dependencies

### APIs
- **The Blue Alliance API**: Competition data, team information, event details
- **Authentication**: TBA-Auth-Key header required for API access

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management
- **Embla Carousel**: Carousel functionality

### Development Tools
- **Drizzle ORM**: Database ORM ready for PostgreSQL integration
- **Zod**: Runtime type validation and schema definitions
- **ESBuild**: Production build optimization

## Deployment Strategy

### Development
- **Vite dev server** with HMR for frontend development
- **TSX** for running TypeScript server code
- **Replit integration** with cartographer plugin for development environment

### Production Build
- **Vite build** for client-side bundling
- **ESBuild** for server-side bundling with external packages
- **Static file serving** through Express for production deployment

### Database Migration Path
- Current: In-memory storage with IStorage interface
- Future: PostgreSQL with Drizzle ORM (configuration already present)
- Schema definitions ready in `shared/schema.ts`

## Changelog

Changelog:
- July 01, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.