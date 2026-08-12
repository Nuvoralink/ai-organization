import type { Request, Response } from "express";

declare const db: { query(sql: string, params?: unknown[]): Promise<unknown> };

export async function findAccount(req: Request, res: Response) {
  const email = String(req.query.email);
  // CLEAN: sql-injection
  const rows = await db.query("SELECT * FROM " + "accounts WHERE email = $1", [email]);
  res.json(rows);
}
