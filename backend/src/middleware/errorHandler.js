import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, req, res, next) {
  const isHttp = err instanceof HttpError;
  const status = isHttp ? err.status : 500;

  const payload = { error: { message: isHttp ? err.message : "Internal server error" } };
  if (isHttp && err.details) payload.error.details = err.details;
  if (process.env.NODE_ENV !== "production" && !isHttp) payload.error.stack = String(err?.stack ?? "");

  res.status(status).json(payload);
}

