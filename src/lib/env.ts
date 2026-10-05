import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

// Read lazily so `next build` works without secrets present.
export function getEnv(): Env {
  cached ??= schema.parse(process.env);
  return cached;
}
