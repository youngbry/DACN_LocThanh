import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import {
  verifyKYC,
  getKYCRequests,
  approveKYC,
  rejectKYC,
  checkImageQuality,
  extractInfo,
  checkIdNumber,
} from "./kycController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "reports.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile))
    fs.writeFileSync(dataFile, JSON.stringify({ reports: [] }, null, 2));
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(raw);
}

function writeStore(store) {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// KYC Routes
app.post("/api/kyc/check-quality", checkImageQuality);
app.post("/api/kyc/extract-info", extractInfo);
app.post("/api/kyc/verify", verifyKYC);
app.get("/api/kyc/requests", getKYCRequests);
app.post("/api/kyc/approve", approveKYC);
app.post("/api/kyc/reject", rejectKYC);
app.post("/api/kyc/check-id", checkIdNumber);

// List reports
app.get("/api/reports", (req, res) => {
  const store = readStore();
  const list = store.reports.sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1; // open first
    return b.createdAt - a.createdAt; // newest first
  });
  res.json(list);
});

// Create report
app.post("/api/reports", (req, res) => {
  const { subject, message, category, tokenId, contact, wallet } =
    req.body || {};
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message required" });
  }
  const store = readStore();
  const now = Date.now();
  const id = nanoid(10);
  const report = {
    id,
    subject: subject?.toString().slice(0, 120) || "Báo cáo sự cố",
    message: message.toString(),
    category: category?.toString() || "other",
    tokenId: tokenId != null ? String(tokenId) : null,
    contact: contact || {},
    wallet: wallet || null,
    status: "open", // open | resolved
    createdAt: now,
    updatedAt: now,
    adminNote: "",
    resolvedBy: null,
    resolvedAt: null,
    unlockRequested: category === "unlock",
    unlockDecision: null, // true | false | null
  };
  store.reports.push(report);
  writeStore(store);
  res.status(201).json(report);
});

// Get a report
app.get("/api/reports/:id", (req, res) => {
  const store = readStore();
  const report = store.reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Not found" });
  res.json(report);
});

// Update/resolve report (admin)
app.patch("/api/reports/:id", (req, res) => {
  const { status, adminNote, unlockDecision, resolvedBy } = req.body || {};
  const store = readStore();
  const idx = store.reports.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const r = store.reports[idx];
  if (typeof adminNote === "string") r.adminNote = adminNote;
  if (typeof unlockDecision === "boolean") r.unlockDecision = unlockDecision;
  if (status === "resolved") {
    r.status = "resolved";
    r.resolvedAt = Date.now();
    r.resolvedBy = resolvedBy || "admin";
  }
  r.updatedAt = Date.now();
  store.reports[idx] = r;
  writeStore(store);
  res.json(r);
});

app.listen(PORT, () => {
  ensureStore();
  console.log(`Report server listening on http://localhost:${PORT}`);
});
