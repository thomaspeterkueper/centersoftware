import { z } from "zod";

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.email().transform((email) => email.toLowerCase()).optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  INITIAL_OWNER_EMAIL: optionalEmail,
  INITIAL_CENTER_CODE: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*$/)
    .default("main"),
  INITIAL_CENTER_NAME: z.string().trim().min(1).max(200).default("Centersoftware"),
});

export const env = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  INITIAL_OWNER_EMAIL: process.env.INITIAL_OWNER_EMAIL,
  INITIAL_CENTER_CODE: process.env.INITIAL_CENTER_CODE,
  INITIAL_CENTER_NAME: process.env.INITIAL_CENTER_NAME,
});
