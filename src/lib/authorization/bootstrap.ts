import { eq } from "drizzle-orm";
import { db } from "@/db";
import { centers, membershipRoles, memberships, roles } from "@/db/schema/core";
import { env } from "@/lib/env";

export type BootstrapUser = {
  id: string;
  email: string;
};

export async function ensureInitialOwner(user: BootstrapUser) {
  if (!env.INITIAL_OWNER_EMAIL || user.email.toLowerCase() !== env.INITIAL_OWNER_EMAIL) {
    return null;
  }

  return db.transaction(async (tx) => {
    const [ownerRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, "owner"))
      .limit(1);

    if (!ownerRole) {
      throw new Error("The owner role is missing. Apply the authorization seed first.");
    }

    let [center] = await tx
      .insert(centers)
      .values({
        code: env.INITIAL_CENTER_CODE,
        name: env.INITIAL_CENTER_NAME,
      })
      .onConflictDoNothing({ target: centers.code })
      .returning({ id: centers.id, code: centers.code, name: centers.name });

    if (!center) {
      [center] = await tx
        .select({ id: centers.id, code: centers.code, name: centers.name })
        .from(centers)
        .where(eq(centers.code, env.INITIAL_CENTER_CODE))
        .limit(1);
    }

    if (!center) {
      throw new Error("The initial center could not be resolved.");
    }

    const [membership] = await tx
      .insert(memberships)
      .values({
        centerId: center.id,
        userId: user.id,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [memberships.centerId, memberships.userId],
        set: {
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning({ id: memberships.id });

    if (!membership) {
      throw new Error("The initial owner membership could not be resolved.");
    }

    await tx
      .insert(membershipRoles)
      .values({
        membershipId: membership.id,
        roleId: ownerRole.id,
      })
      .onConflictDoNothing();

    return center;
  });
}
