# Overview

This is a fully functional task management application called "Azzrk WordPress Team Task Manager" built with React, TypeScript, and Firebase. The application allows team members to create, manage, and track tasks with admin oversight capabilities. It features Google authentication, role-based access control where regular members can manage their own tasks while admins have dashboard views of all team activities and can export data in a simple format.

## Project Status: COMPLETE ✓
- Google Authentication with Firebase: ✓ Implemented
- Role-based access control: ✓ Admin email: amr90ahmad@gmail.com
- Member CRUD operations: ✓ Full task management
- Admin dashboard with today's overview: ✓ Real-time data
- Export functionality: ✓ Simple format with copy/download
- Ready for Vercel deployment: ✓ All dependencies configured

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using **React 18** with **TypeScript** and follows a component-based architecture:

- **UI Framework**: Uses shadcn/ui components built on Radix UI primitives for consistent, accessible interface elements
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **State Management**: React Context API for authentication state, React Hook Form for form management, and TanStack Query for server state
- **Routing**: Wouter for client-side routing with protected route logic based on authentication state
- **Build Tool**: Vite for development server and bundling with hot module replacement

The frontend follows a role-based conditional rendering pattern where the main App component determines which dashboard to show (Admin vs Member) based on user permissions.

## Backend Architecture

The backend uses **Express.js** with TypeScript in a minimal REST API structure:

- **Server Framework**: Express with middleware for JSON parsing, CORS, and request logging
- **Database Layer**: Abstracted through an IStorage interface with both in-memory and persistent implementations
- **Development Setup**: Vite integration for SSR during development with separate production build process
- **API Structure**: Centralized route registration system with /api prefix for all endpoints

The storage layer is designed to be swappable between implementations (currently memory-based but structured for database integration).

## Authentication & Authorization

**Firebase Authentication** handles user management:

- **Provider**: Google OAuth integration for sign-in
- **User Profiles**: Custom user documents stored in Firestore with display names and admin flags
- **Role Management**: Admin role determined by specific email address check (amr90ahmad@gmail.com)
- **Session Management**: Firebase Auth state persistence with React context provider pattern

## Database Design

**Firestore** serves as the primary database with two main collections:

- **Users Collection**: Stores user profiles with id, email, displayName, isAdmin flag, and timestamps
- **Tasks Collection**: Contains task data with userId references, Trello integration fields, time estimates, and status tracking

The schema supports PostgreSQL through Drizzle ORM configuration, indicating potential for database migration. The Drizzle schema defines the same structure with proper foreign key relationships.

## External Dependencies

- **Firebase Services**: Authentication, Firestore database, and hosting infrastructure
- **Google OAuth**: For user authentication and account creation
- **Trello Integration**: Tasks include Trello task references and links for external project management
- **Neon Database**: PostgreSQL configuration present but not actively used (Drizzle config points to DATABASE_URL)
- **Replit Platform**: Development environment integration with custom dev tooling and error handling

The application is architected to support both Firebase (currently active) and PostgreSQL backends, with the database abstraction layer ready for either implementation.

## Deployment Configuration for Vercel

The application is ready for deployment on Vercel with the following setup:
- Environment variables needed: VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID, VITE_FIREBASE_PROJECT_ID
- All dependencies are installed and configured
- Build command: `npm run build`
- Output directory: `dist`
- No server-side requirements (pure client-side Firebase app)

## Recent Changes (August 15, 2025)

✓ Fixed all TypeScript compilation errors
✓ Resolved Firebase Timestamp handling for cross-platform compatibility  
✓ Updated icon imports (FaRefresh → FaRedo)
✓ Added proper HTML meta tags and title
✓ Implemented complete task management system
✓ Added real-time updates via Firebase listeners
✓ Created export functionality with clipboard and download options

## Migration Completed (August 18, 2025)

✓ Successfully migrated from Replit Agent to Replit environment
✓ Installed all required Node.js packages and dependencies
✓ Resolved tsx command not found issue during initial startup
✓ Added Firebase configuration environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID)
✓ Fixed timestamp conversion bug in TaskModal component for proper Firebase Timestamp handling
✓ Verified application runs successfully on port 5000
✓ Maintained client/server separation and security best practices
✓ Application is now fully compatible with Replit deployment infrastructure

## Migration Completed (August 18, 2025)

✓ Successfully migrated from Replit Agent to Replit environment
✓ Installed all required Node.js packages and dependencies
✓ Resolved tsx command not found issue during initial startup
✓ Added Firebase configuration environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID)
✓ Verified application runs successfully on port 5000
✓ Maintained client/server separation and security best practices
✓ Application is now fully compatible with Replit deployment infrastructure