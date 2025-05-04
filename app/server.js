import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"))
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const app = express();
app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json());

/** Helper to verify the incoming Firebase ID token */
async function verifyToken(req) {
  const raw = req.headers.authorization?.split("Bearer ")[1] || "";
  const decoded = await admin.auth().verifyIdToken(raw);
  return decoded.uid;
}

/** 1) Save or update a game session → `Games` */
app.post("/save-game", async (req, res) => {
  console.log("🔥 [save-game] payload:", req.body);
  try {
    const uid = await verifyToken(req);
    const {
      gameId,
      boardState,
      score,
      startTime,
      endTime,
      factoryResources,
      metadata = {}
    } = req.body;

    const data = {
      userId:        uid,
      boardState,
      score,
      factoryResources,
      metadata,
      startTime:     admin.firestore.Timestamp.fromDate(new Date(startTime)),
      endTime:       admin.firestore.Timestamp.fromDate(new Date(endTime)),
      updatedAt:     admin.firestore.FieldValue.serverTimestamp()
    };

    const games = db.collection("Games");
    if (gameId) {
      // upsert into the same document
      await games.doc(gameId).set(data, { merge: true });
      return res.status(200).json({ success: true, gameId });
    } else {
      // first save → auto‑ID
      const docRef = await games.add(data);
      return res.status(200).json({ success: true, gameId: docRef.id });
    }
  } catch (e) {
    console.error("save-game error", e);
    res.status(500).json({ error: e.message });
  }
});

/** 2) Unlock an achievement → `UserAchievements` */
app.post("/unlock-achievement", async (req, res) => {
  try {
    const uid = await verifyToken(req);
    const { gameId, achievementId } = req.body;

    if (!achievementId || !gameId) {
      return res.status(400).json({ error: "Missing gameId or achievementId" });
    }

    const docId = `${gameId}_${achievementId}`;
    const achRef = db.collection("UserAchievements").doc(docId);
    const snap  = await achRef.get();
    if (snap.exists) {
      return res.status(200).json({ success: false, message: "Already unlocked" });
    }

    await achRef.set({
      userId:        uid,
      gameId,
      achievementId,
      earnedAt:      admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("unlock-achievement error", e);
    res.status(500).json({ error: e.message });
  }
});

/** 3) List all achievement definitions → `Achievements` */
app.get("/api/achievement-definitions", async (_req, res) => {
  try {
    const snap = await db.collection("Achievements").get();
    const defs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(defs);
  } catch (e) {
    console.error("get definitions error", e);
    res.status(500).json({ error: e.message });
  }
});

/** 4) (Optional) Create or update a definition — admin only */
app.post("/achievement-definitions", async (req, res) => {
  try {
    // You could verify an admin claim here
    const { id, name, description, iconUrl, criteria } = req.body;
    if (!id || !name || !description || !criteria) {
      return res.status(400).json({ error: "Missing fields" });
    }
    await db.collection("Achievements").doc(id).set({
      name, description, iconUrl: iconUrl || null, criteria
    });
    res.json({ success: true });
  } catch (e) {
    console.error("create definition error", e);
    res.status(500).json({ error: e.message });
  }
});

/** 5) Create or update a user profile → `Users` */
app.post("/create-user", async (req, res) => {
  try {
    const uid = await verifyToken(req);
    const { displayName, email } = req.body;
    await db.collection("Users").doc(uid).set({
      displayName: displayName || null,
      email:       email || null,
      joinedAt:    admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ success: true });
  } catch (e) {
    console.error("create-user error", e);
    res.status(500).json({ error: e.message });
  }
});

/** 6) Fetch a user’s Games */
app.get("/Games", async (req, res) => {
  try {
    const uid = await verifyToken(req);
    // Fetch all games for this user (no index needed)
    const snap = await db
      .collection("Games")
      .where("userId", "==", uid)
      .get();
    const Games = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => {
        // Firestore Timestamps → Date → number for sorting
        const aMs = a.endTime.toDate();
        const bMs = b.endTime.toDate();
        return bMs - aMs;
      });   
    res.json(Games);
  } catch (e) {
    console.error("get Games error", e);
    res.status(500).json({ error: e.message });
  }
});

/** 7) Fetch a user’s unlocked achievements */
app.get("/api/user-achievements", async (req, res) => {
  try {
    const uid = await verifyToken(req);
    const snap = await db
      .collection("UserAchievements")
      .where("userId", "==", uid)
      .get();
    const ach = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(ach);
  } catch (e) {
    console.error("get UserAchievements error", e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.VITE_BACKEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
