import type { Request, Response } from "express";

type TenantRequest = Request & { user: { tenantId: string } };
declare const db: { query(sql: string, params: unknown[]): Promise<unknown> };

export async function getInvoice(req: TenantRequest, res: Response) {
  const id = req.params.id;
  // VULN: tenant-isolation
  const rows = await db.query("SELECT * FROM invoices WHERE id = ?", [id]);
  res.json(rows);
}
