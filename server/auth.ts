import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";

// Create memory store for sessions
const SessionStore = MemoryStore(session);

// Define authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

// Define authorization middleware for specific roles
export function hasRole(role: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const roles = Array.isArray(role) ? role : [role];
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Authorization error" });
    }
  };
}

// Setup session and auth middleware
export function setupAuth(app: Express) {
  // Configure session middleware
  app.use(
    session({
      name: "session",
      secret: process.env.SESSION_SECRET || "healthcare-app-secret",
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        sameSite: "lax"
      },
      store: new SessionStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false
    })
  );
  
  // Expose current user to all routes
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.session && req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          // Attach user to request object without password for security
          const { password, ...userWithoutPassword } = user;
          (req as any).user = userWithoutPassword;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });
}
