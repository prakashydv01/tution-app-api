import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
export const created = <T>(data: T) => NextResponse.json(data, { status: 201 });

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
  return validate(schema, json);
}

export function parseQuery<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return validate(schema, params);
}

function validate<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request data", z.flattenError(result.error));
  }
  return result.data;
}

/** Wraps a route handler with consistent JSON error responses. */
export function handler<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json(
          { error: { code: e.code, message: e.message, details: e.details } },
          { status: e.status },
        );
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          return NextResponse.json(
            { error: { code: "CONFLICT", message: "Resource already exists" } },
            { status: 409 },
          );
        }
        if (e.code === "P2025") {
          return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Resource not found" } },
            { status: 404 },
          );
        }
        if (e.code === "P2003") {
          return NextResponse.json(
            {
              error: {
                code: "IN_USE",
                message: "This can't be deleted because other records still reference it",
              },
            },
            { status: 409 },
          );
        }
      }
      console.error("Unhandled API error:", e);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
        { status: 500 },
      );
    }
  };
}

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
export const idParam = z.coerce.number().int().positive();