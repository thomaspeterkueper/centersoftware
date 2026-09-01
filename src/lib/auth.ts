import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { authTables } from "@/db/schema/auth";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authTables,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !env.INITIAL_OWNER_EMAIL,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (
            !env.INITIAL_OWNER_EMAIL ||
            user.email.toLowerCase() !== env.INITIAL_OWNER_EMAIL
          ) {
            throw new APIError("FORBIDDEN", {
              message: "Registration is not enabled for this email address.",
            });
          }

          return { data: user };
        },
      },
    },
  },
});
