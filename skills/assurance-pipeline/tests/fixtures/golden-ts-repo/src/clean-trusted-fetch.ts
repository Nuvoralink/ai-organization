import type { Request, Response } from "express";

export async function readUrl(req: Request, res: Response) {
  // CLEAN: ssrf
  const upstream = await fetch("https://status.example.test/health");
  res.status(upstream.status).send(await upstream.text());
}
