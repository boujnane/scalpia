import { NextResponse } from "next/server"
import { collection, getDocs, query, where, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type IndexStatus =
  | "UP_TO_DATE"
  | "IN_PROGRESS"
  | "OUTDATED"

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)

  const itemsSnap = await getDocs(collection(db, "items"))

  const totalItems = itemsSnap.size
  if (totalItems === 0) {
    return NextResponse.json({ status: "OUTDATED" })
  }

  let itemsWithTodayPrice = 0

  for (const itemDoc of itemsSnap.docs) {
    const pricesRef = collection(db, `items/${itemDoc.id}/prices`)
    const q = query(
      pricesRef,
      where("date", "==", today),
      limit(1)
    )

    const pricesSnap = await getDocs(q)

    if (!pricesSnap.empty) {
      itemsWithTodayPrice++

      // 🟡 On sait déjà que c'est EN COURS
      // mais on continue pour savoir si c'est À JOUR
    } else {
      // Si on trouve un item sans prix aujourd'hui
      // on ne pourra jamais être UP_TO_DATE
    }
  }

  let status: IndexStatus

  if (itemsWithTodayPrice === 0) {
    status = "OUTDATED" // 🔴 aucun item à jour
  } else if (itemsWithTodayPrice === totalItems) {
    status = "UP_TO_DATE" // 🟢 tous à jour
  } else {
    status = "IN_PROGRESS" // 🟡 partiellement à jour
  }

  return NextResponse.json({
    status,
    totalItems,
    itemsWithTodayPrice,
  })
}
