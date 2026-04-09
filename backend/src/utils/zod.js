import { ZodError } from "zod";
import { badRequest } from "./httpError.js";

export function parseOr400(schema, data) {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) throw badRequest("Validation failed", err.flatten());
    throw err;
  }
}

