// app/api/contact/route.ts
import { NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { Resend } from "resend"

export const runtime = "nodejs"

type ContactPayload = {
  name?: string
  email: string
  subject?: "support" | "bug" | "billing" | "other"
  message: string
  // anti-spam honeypot (doit rester vide)
  company?: string
}

function getClientIp(req: Request) {
  // Vercel / proxies
  const xf = req.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0].trim()
  return "unknown"
}

function todayKeyParis() {
  // clé journalière (Europe/Paris) - suffisant pour un rate limit
  const now = new Date()
  // on ne chipote pas sur la timezone serveur : on veut juste un "jour" stable
  // si tu veux ultra exact Paris, je te ferai une version luxon/date-fns-tz
  return now.toISOString().slice(0, 10) // YYYY-MM-DD
}

async function checkAndIncrementRateLimit(ip: string) {
  const db = adminDb()
  const day = todayKeyParis()
  const ref = db.collection("rateLimits").doc(`contact_${day}_${ip}`)

  // 10 messages / jour / IP (ajuste)
  const LIMIT = 10

  const snap = await ref.get()
  const current = snap.exists ? Number(snap.data()?.count || 0) : 0

  if (current >= LIMIT) {
    return { ok: false, remaining: 0 }
  }

  await ref.set(
    {
      count: current + 1,
      updatedAt: new Date(),
      day,
      ip,
    },
    { merge: true }
  )

  return { ok: true, remaining: LIMIT - (current + 1) }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as ContactPayload | null
    if (!body) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Honeypot (si rempli => bot)
    if (body.company && body.company.trim().length > 0) {
      return NextResponse.json({ success: true }) // on répond OK sans rien faire
    }

    const name = (body.name || "").trim()
    const email = (body.email || "").trim().toLowerCase()
    const subject = body.subject || "other"
    const message = (body.message || "").trim()

    if (!email || !message) {
      return NextResponse.json({ error: "Email et message requis." }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: "Message trop court." }, { status: 400 })
    }

    // Rate limit
    const ip = getClientIp(req)
    const rl = await checkAndIncrementRateLimit(ip)
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de messages aujourd’hui. Réessaie plus tard." },
        { status: 429 }
      )
    }

    // Optionnel : récupérer userId depuis token Firebase si présent
    let userId: string | null = null
    let authedEmail: string | null = null
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (token) {
      try {
        const decoded = await adminAuth().verifyIdToken(token)
        userId = decoded.uid
        authedEmail = decoded.email || null
      } catch {
        // token invalide => on ignore, on ne bloque pas
      }
    }

    const db = adminDb()

    // 1) Firestore : on stocke le message
    const docRef = await db.collection("contacts").add({
      name: name || null,
      email,
      subject,
      message,
      userId: userId || null,
      authedEmail: authedEmail || null,
      status: "new",
      createdAt: new Date(),
      ip: ip === "unknown" ? null : ip,
      source: "contact_page",
    })

    // 2) Email : on envoie la notif
    const resendKey = process.env.RESEND_API_KEY
    const toEmail = process.env.CONTACT_TO_EMAIL
    const fromEmail = process.env.CONTACT_FROM_EMAIL

    if (!resendKey || !toEmail || !fromEmail) {
      // On ne casse pas : Firestore a déjà l’info
      console.warn("[CONTACT] Missing RESEND/CONTACT env vars, email skipped.")
      return NextResponse.json({ success: true, id: docRef.id, emailSent: false })
    }

    const resend = new Resend(resendKey)

    const subjectLine =
      subject === "support"
        ? "Support"
        : subject === "bug"
        ? "Bug"
        : subject === "billing"
        ? "Facturation"
        : "Autre"

    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `📩 Contact Pokéindex — ${subjectLine}`,
      html: `
        <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6">
          <h2 style="margin:0 0 12px">Nouveau message (Contact)</h2>
          <p style="margin:0 0 8px"><strong>Nom :</strong> ${escapeHtml(name || "—")}</p>
          <p style="margin:0 0 8px"><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p style="margin:0 0 8px"><strong>Sujet :</strong> ${escapeHtml(subjectLine)}</p>
          <p style="margin:0 0 8px"><strong>UserId :</strong> ${escapeHtml(userId || "—")}</p>
          <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb" />
          <p style="white-space: pre-wrap; margin:0">${escapeHtml(message)}</p>
          <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb" />
          <p style="margin:0; font-size: 12px; color:#6b7280">
            DocId Firestore: ${escapeHtml(docRef.id)}
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, id: docRef.id, emailSent: true })
  } catch (err) {
    console.error("[CONTACT] Error:", err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
