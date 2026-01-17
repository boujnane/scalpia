// app/api/_test-admin/route.ts
import { adminAuth } from "@/lib/firebase-admin";

export async function GET() {
  const users = await adminAuth().listUsers(1);
  return Response.json({ ok: true });
}
