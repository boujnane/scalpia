import { redirect } from "next/navigation";
import SuccessClient from "./success-client";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: { session_id?: string };
};

async function isValidSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const complete = session.status === "complete";
    return paid || complete;
  } catch {
    return false;
  }
}

export default async function Page({ searchParams }: PageProps) {
  const sessionId = searchParams?.session_id;
  if (!sessionId) {
    redirect("/pricing");
  }

  const ok = await isValidSession(sessionId);
  if (!ok) {
    redirect("/pricing");
  }

  return <SuccessClient />;
}
