import express, { Request, Response, Router } from 'express';
import { 
  searchMasjidsByZipCode, 
  getMasjidDetails, 
  getMasjidPrayerTimes, 
  getMasjidWeeklyPrayerTimes 
} from "./lib/masjidi-api";
import { storage } from "./storage";

// Create a router for Masjidi API endpoints
const masjidiRouter: Router = express.Router();

// Masjid search endpoint
masjidiRouter.get("/masjids/search", async (req: Request, res: Response) => {
  try {
    const zipCode = req.query.zipCode as string;
    if (!zipCode) {
      return res.status(400).json({ error: "Zip code is required" });
    }
    
    const results = await searchMasjidsByZipCode(zipCode);
    res.json(results);
  } catch (error) {
    console.error("Error searching masjids:", error);
    res.status(500).json({ error: "Failed to search masjids" });
  }
});

// Masjid details endpoint
masjidiRouter.get("/masjids/:id", async (req: Request, res: Response) => {
  try {
    const masjidId = req.params.id;
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    const masjidDetails = await getMasjidDetails(masjidId);
    res.json(masjidDetails);
  } catch (error) {
    console.error("Error getting masjid details:", error);
    res.status(500).json({ error: "Failed to get masjid details" });
  }
});

// Masjid prayer times endpoint
masjidiRouter.get("/masjids/:id/prayertimes", async (req: Request, res: Response) => {
  try {
    const masjidId = req.params.id;
    const date = req.query.date as string || undefined;
    
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    const prayerTimes = await getMasjidPrayerTimes(masjidId, date);
    res.json(prayerTimes);
  } catch (error) {
    console.error("Error getting prayer times:", error);
    res.status(500).json({ error: "Failed to get prayer times" });
  }
});

// Masjid weekly prayer times endpoint
masjidiRouter.get("/masjids/:id/prayertimes/week", async (req: Request, res: Response) => {
  try {
    const masjidId = req.params.id;
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    const weeklyPrayerTimes = await getMasjidWeeklyPrayerTimes(masjidId);
    res.json(weeklyPrayerTimes);
  } catch (error) {
    console.error("Error getting weekly prayer times:", error);
    res.status(500).json({ error: "Failed to get weekly prayer times" });
  }
});

// User settings endpoints
masjidiRouter.get("/user/settings", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const settings = await storage.getUserSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error("Error getting user settings:", error);
    res.status(500).json({ error: "Failed to get user settings" });
  }
});

masjidiRouter.post("/user/settings", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const settings = await storage.saveUserSettings({
      userId: userId,
      name: req.body.name,
      email: req.body.email,
      preferences: {
        ...req.body.preferences
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error("Error saving user settings:", error);
    res.status(500).json({ error: "Failed to save user settings" });
  }
});

masjidiRouter.post("/user/settings/preferred-masjid", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const masjidId = req.body.masjidId;
    const masjidName = req.body.masjidName;
    const masjidAddress = req.body.masjidAddress;
    const masjidZipCode = req.body.masjidZipCode;
    
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    // First get the existing user settings
    const existingSettings = await storage.getUserSettings(userId);
    
    // Update with new selected masjid while preserving other preferences
    await storage.updateUserSettings(userId, { 
      preferences: {
        // Keep existing preferences or set defaults
        emailNotifications: existingSettings?.preferences.emailNotifications ?? false,
        darkMode: existingSettings?.preferences.darkMode ?? false,
        saveHistory: existingSettings?.preferences.saveHistory ?? true,
        // Update selected masjid
        selectedMasjid: {
          id: masjidId,
          name: masjidName || "Unnamed Masjid",
          address: masjidAddress || "",
          zipCode: masjidZipCode || ""
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error setting preferred masjid:", error);
    res.status(500).json({ error: "Failed to set preferred masjid" });
  }
});

export default masjidiRouter; 