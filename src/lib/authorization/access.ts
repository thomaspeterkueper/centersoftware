import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  centers,
  membershipRoles,
  memberships,
  rolePermissions,
  roles,
} from "@/db/schema/core";
import { getServerSession } from "@/lib/auth/session";
import type { Permission } from "@/lib/authorization/permissions";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class PermissionDeniedError extends Error {
  constructor(permission: Permission, centerId: string) {
    super(`Permission ${permission} is required for center ${centerId}.`);
    this.name = "PermissionDeniedError";
  }
}

export async function listUserCenters(userId: string) {
  return db
    .select({
      id: centers.id,
      code: centers.code,
      name: centers.name,
      membershipId: memberships.id,
      roleKey: roles.key,
    })
    .from(memberships)
    .innerJoin(centers, eq(centers.id, memberships.centerId))
    .leftJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
    .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")));
}

export async function hasPermissionForUser(
  userId: string,
  centerId: string,
  permission: Permission,
) {
  const [row] = await db
    .select({ membershipId: memberships.id })
    .from(memberships)
    .innerJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, membershipRoles.roleId))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.centerId, centerId),
        eq(memberships.status, "active"),
        eq(rolePermissions.permissionKey, permission),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function requirePermission(centerId: string, permission: Permission) {
  const session = await getServerSession();

  if (!session) {
    throw new AuthenticationRequiredError();
  }

  const [row] = await db
    .select({ membershipId: memberships.id })
    .from(memberships)
    .innerJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, membershipRoles.roleId))
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.centerId, centerId),
        eq(memberships.status, "active"),
        eq(rolePermissions.permissionKey, permission),
      ),
    )
    .limit(1);

  if (!row) {
    throw new PermissionDeniedError(permission, centerId);
  }

  return {
    session,
    centerId,
    membershipId: row.membershipId,
  };
}
