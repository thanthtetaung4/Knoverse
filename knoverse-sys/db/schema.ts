import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  jsonb,
  integer,
  real,
  pgSchema,
} from 'drizzle-orm/pg-core';

/* =====================================================
   USERS
   ===================================================== */

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Supabase auth.users.id

  email: text('email').notNull().unique(),
  fullName: text('full_name'),

  role: text('role', {
    enum: ['admin', 'manager', 'member'],
  }).notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow(),
});

/* =====================================================
   TEAM FILES
   ===================================================== */

export const teamFiles = pgTable('team_files', {
  // legacy/simple table structure used in your DB
  // id is an int8 in the actual DB; using integer() here to represent it
  id: uuid('id').defaultRandom().primaryKey(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  objectId: uuid('object_id').notNull(),
});

export type TeamFile = typeof teamFiles.$inferSelect;

export type TeamFileInsert = typeof teamFiles.$inferInsert;

export type UserDB = typeof users.$inferSelect;

/* =====================================================
   TEAMS
   ===================================================== */

export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull().unique(),
  description: text('description'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow(),
});

export type Team = typeof teams.$inferSelect;

export type TeamInsert = typeof teams.$inferInsert;
/* =====================================================
   TEAM MEMBERS (M:N)
   ===================================================== */

export const teamMembers = pgTable(
  'team_members',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),

    joinedAt: timestamp('joined_at', {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey(table.userId, table.teamId),
  })
);

/* =====================================================
   CHAT SESSIONS
   ===================================================== */

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),

  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow(),
});

/* =====================================================
   CHAT MESSAGES
   ===================================================== */

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),

  chatSessionId: uuid('chat_session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),

  role: text('role', {
    enum: ['user', 'assistant', 'admin'],
  }).notNull(),

  content: text('content').notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow(),
});

/* =====================================================
   ANALYTICS EVENTS
   ===================================================== */

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),

  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow(),
});

/* =====================================================
   STORAGE (supabase) — buckets + objects
   Mirrors common Supabase storage.tables: storage.buckets and storage.objects
   ===================================================== */

export const storage = pgSchema("storage");

export const objects = storage.table("objects", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucketId: text("bucket_id").notNull(),
  name: text("name").notNull(),
  owner: uuid("owner"),
  ownerId: uuid("owner_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

