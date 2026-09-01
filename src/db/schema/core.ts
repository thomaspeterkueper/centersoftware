import {
  index,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const appSchema = pgSchema("app");

export const centers = appSchema.table(
  "center",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("center_code_unique").on(table.code)],
);

export const memberships = appSchema.table(
  "membership",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    centerId: uuid("center_id")
      .notNull()
      .references(() => centers.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 }).default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("membership_center_user_unique").on(table.centerId, table.userId),
    index("membership_user_idx").on(table.userId),
  ],
);

export const roles = appSchema.table(
  "role",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("role_key_unique").on(table.key)],
);

export const permissions = appSchema.table("permission", {
  key: varchar("key", { length: 120 }).primaryKey(),
  description: text("description"),
});

export const membershipRoles = appSchema.table(
  "membership_role",
  {
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.membershipId, table.roleId] })],
);

export const rolePermissions = appSchema.table(
  "role_permission",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionKey: varchar("permission_key", { length: 120 })
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionKey] })],
);
