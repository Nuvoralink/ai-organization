import type { Request, Response } from "express";

export async function readUrl(req: Request, res: Response) {
  // VULN: ssrf
  const upstream = await fetch(String(req.query.url));
  res.status(upstream.status).send(await upstream.text());
}
