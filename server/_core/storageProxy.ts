/**
 * Serves uploaded files from the local `uploads/` directory at `/uploads/*`.
 */

import path from "path";
import fs from "fs";
import type { Express } from "express";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

export function registerStorageProxy(app: Express) {
  app.get("/uploads/*", (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing file key");
      return;
    }

    // Prevent path traversal
    const filePath = path.resolve(UPLOADS_DIR, key);
    if (!filePath.startsWith(UPLOADS_DIR + path.sep) && filePath !== UPLOADS_DIR) {
      res.status(400).send("Invalid path");
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).send("File not found");
      return;
    }

    res.set("Cache-Control", "private, max-age=31536000");
    res.sendFile(filePath);
  });
}
