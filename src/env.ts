import { z } from "zod";

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLOAKING_AUTH_TOKEN: z.string().min(32, "Auth token must be at least 32 characters"),
});

export const env = envSchema.parse({
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NODE_ENV: process.env.NODE_ENV,
  CLOAKING_AUTH_TOKEN: process.env.CLOAKING_AUTH_TOKEN,
});
