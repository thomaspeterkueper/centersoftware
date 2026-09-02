import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalEmail = z.preprocess(
  blankToUndefined,
  z.email().transform((email) => email.toLowerCase()).optional(),
);

const defaultedString = (schema: z.ZodString, fallback: string) =>
  z.preprocess(blankToUndefined, schema.default(fallback));

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();

const inferredAuthUrl = vercelHost ? `https://${vercelHost}` : undefined;

// `next build` imports server modules while collecting route metadata. Runtime
// secrets must still be mandatory for the deployed application, but their
// absence must not make a purely static build step fail before a request is
// ever handled. npm exposes `npm_lifecycle_event=build` to the `next build`
// subprocess, so only that build process receives inert local placeholders.
const isBuildProcess = process.env.npm_lifecycle_event === "build";

const buildDatabaseUrl = "postgresql://build:build@127.0.0.1:5432/build";
const buildAuthSecret = "centersoftware-build-only-secret-not-used-at-runtime";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.preprocess(blankToUndefined, z.url().default("http://localhost:3000")),
  INITIAL_OWNER_EMAIL: optionalEmail,
  INITIAL_CENTER_CODE: defaultedString(
    z.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/),
    "main",
  ),
  INITIAL_CENTER_NAME: defaultedString(
    z.string().trim().min(1).max(200),
    "Centersoftware",
  ),
});

export const env = serverEnvSchema.parse({
  DATABASE_URL:
    blankToUndefined(process.env.DATABASE_URL) ?? (isBuildProcess ? buildDatabaseUrl : undefined),
  BETTER_AUTH_SECRET:
    blankToUndefined(process.env.BETTER_AUTH_SECRET) ??
    (isBuildProcess ? buildAuthSecret : undefined),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || inferredAuthUrl,
  INITIAL_OWNER_EMAIL: process.env.INITIAL_OWNER_EMAIL,
  INITIAL_CENTER_CODE: process.env.INITIAL_CENTER_CODE,
  INITIAL_CENTER_NAME: process.env.INITIAL_CENTER_NAME,
});
