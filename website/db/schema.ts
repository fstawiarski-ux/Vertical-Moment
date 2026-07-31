import { sqliteTable, text, integer, primaryKey, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * VMC contribution schema for Cloudflare D1 (SQLite), converted from the
 * original Postgres schema. D1 has no row-level security, so authorization is
 * enforced in the app/worker layer (see lib/identity.ts + app/chatgpt-auth.ts).
 * Enable D1 in .openai/hosting.json, then `npm run db:generate` to create migrations.
 */

const now = sql`(unixepoch())`;
const uuid = sql`(lower(hex(randomblob(16))))`;

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),                 // SIWC email (stable per user)
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["contributor", "reviewer", "admin"] }).notNull().default("contributor"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const checklistTemplates = sqliteTable("checklist_templates", {
  id: text("id").primaryKey().default(uuid),
  name: text("name").notNull(),
  missionType: text("mission_type").notNull(),
  version: integer("version").notNull().default(1),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const checklistTemplateItems = sqliteTable("checklist_template_items", {
  id: text("id").primaryKey().default(uuid),
  templateId: text("template_id").notNull().references(() => checklistTemplates.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  helpText: text("help_text"),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  evidenceType: text("evidence_type").notNull().default("none"),
});

export const missions = sqliteTable("missions", {
  id: text("id").primaryKey().default(uuid),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  missionType: text("mission_type").notNull(),
  cragName: text("crag_name"),                 // references the crag layer by name
  wallName: text("wall_name"),
  templateId: text("template_id").references(() => checklistTemplates.id),
  priority: text("priority").notNull().default("medium"),
  status: text("status", {
    enum: ["draft", "open", "assigned", "ready_for_review", "under_review", "changes_requested", "approved", "archived"],
  }).notNull().default("draft"),
  createdBy: text("created_by").references(() => profiles.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const missionAssignments = sqliteTable("mission_assignments", {
  missionId: text("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  contributorId: text("contributor_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull().default(now),
}, (t) => [primaryKey({ columns: [t.missionId, t.contributorId] })]);

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey().default(uuid),
  missionId: text("mission_id").notNull().references(() => missions.id),
  contributorId: text("contributor_id").notNull().references(() => profiles.id),
  status: text("status").notNull().default("draft"),
  collectionDate: text("collection_date"),
  confidence: integer("confidence"),           // 1–5
  verificationSource: text("verification_source", {
    enum: ["personally_verified", "local_expert", "published_source", "estimated", "unconfirmed"],
  }).notNull().default("unconfirmed"),
  generalNotes: text("general_notes"),
  safetyFlag: integer("safety_flag", { mode: "boolean" }).notNull().default(false),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewedBy: text("reviewed_by").references(() => profiles.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const submissionAnswers = sqliteTable("submission_answers", {
  id: text("id").primaryKey().default(uuid),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  checklistItemId: text("checklist_item_id").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  answerText: text("answer_text"),
});

export const submissionFiles = sqliteTable("submission_files", {
  id: text("id").primaryKey().default(uuid),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  checklistItemId: text("checklist_item_id"),
  r2Key: text("r2_key").notNull(),             // object key in the R2 bucket
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  evidenceType: text("evidence_type").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  capturedAt: integer("captured_at", { mode: "timestamp" }),
  caption: text("caption"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const reviewComments = sqliteTable("review_comments", {
  id: text("id").primaryKey().default(uuid),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  checklistItemId: text("checklist_item_id"),
  authorId: text("author_id").notNull().references(() => profiles.id),
  body: text("body").notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});
