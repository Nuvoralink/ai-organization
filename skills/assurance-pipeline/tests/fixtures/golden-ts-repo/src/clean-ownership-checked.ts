import type { Request, Response } from "express";

type AuthenticatedRequest = Request & { user: { id: string } };
declare const db: { records: { findFirst(args: { where: { id: string; ownerId?: string } }): Promise<unknown> } };

export async function getRecord(req: AuthenticatedRequest, res: Response) {
  // CLEAN: authz-object-scope
  const record = await db.records.findFirst({ where: { id: req.params.id, ownerId: req.user.id } });
  res.json(record);
}
