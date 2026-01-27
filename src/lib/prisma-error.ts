/**
 * Detects "database not reachable / wrong credentials" situations so API routes
 * can return a clean 503 instead of a noisy 500 stack trace.
 *
 * We intentionally avoid importing Prisma runtime error classes directly because
 * Next.js bundling (and Prisma versions) can make instanceof checks unreliable.
 */
export function isPrismaConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const anyErr = err as { name?: unknown; message?: unknown; code?: unknown };
  const name = typeof anyErr.name === "string" ? anyErr.name : "";
  const message = typeof anyErr.message === "string" ? anyErr.message : "";

  // Common Prisma init/connect failures
  if (name === "PrismaClientInitializationError") return true;
  if (name === "PrismaClientKnownRequestError" && message.includes("P1001"))
    return true;

  // MySQL credential / network issues often surface as message text
  const m = message.toLowerCase();
  if (m.includes("authentication failed against database server")) return true;
  if (m.includes("access denied for user")) return true;
  if (m.includes("can't reach database server")) return true;
  if (m.includes("timed out") && m.includes("database")) return true;

  return false;
}

