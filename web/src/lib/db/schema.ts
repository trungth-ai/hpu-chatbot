import {
  pgTable,
  bigserial,
  bigint,
  integer,
  text,
  boolean,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";

// Kiểu vector(768) của pgvector — khai báo custom để không phụ thuộc phiên bản drizzle.
const vector768 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(768)";
  },
});

// ----- Người dùng (Sprint 1) -----
export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  picture: text("picture"),
  role: text("role").notNull().default("sinh-vien"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
});

// ----- Nguồn tài liệu Google Drive (Sprint 3) -----
export const driveSources = pgTable("drive_sources", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  folderId: text("folder_id").notNull(),
  product: text("product").notNull(),
  module: text("module"),
  roleScope: text("role_scope").array().notNull(),
  version: text("version"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ----- File đã đồng bộ từ Drive (Sprint 3) -----
export const driveFiles = pgTable("drive_files", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sourceId: bigint("source_id", { mode: "number" }),
  driveFileId: text("drive_file_id").notNull().unique(),
  name: text("name"),
  mimeType: text("mime_type"),
  md5: text("md5"),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

// ----- Kho tri thức đã chunk (Sprint 3) -----
export const kbDocuments = pgTable("kb_documents", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  product: text("product").notNull(),
  module: text("module"),
  roleScope: text("role_scope").array().notNull(),
  version: text("version"),
  driveFileId: text("drive_file_id"),
  sourceFile: text("source_file"),
  sourceUrl: text("source_url"),
  page: integer("page"),
  section: text("section"),
  imageUrl: text("image_url"),
  content: text("content").notNull(),
  embedding: vector768("embedding"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DriveSource = typeof driveSources.$inferSelect;
export type KbDocument = typeof kbDocuments.$inferSelect;

// ----- Khoảng trống tri thức (Sprint 4) -----
export const knowledgeGaps = pgTable("knowledge_gaps", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  question: text("question").notNull(),
  product: text("product"),
  role: text("role"),
  channel: text("channel").default("web"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
