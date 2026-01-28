import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type UserProfile = {
  firstName: string
  lastName: string
  photoURL: string | null
  updatedAt: string
}

export const DEFAULT_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  photoURL: null,
  updatedAt: new Date().toISOString(),
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        photoURL: data.photoURL || null,
        updatedAt: data.updatedAt || new Date().toISOString(),
      }
    }

    return DEFAULT_PROFILE
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return DEFAULT_PROFILE
  }
}

export async function updateUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  try {
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)

    const updatedProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    }

    if (docSnap.exists()) {
      await updateDoc(docRef, updatedProfile)
    } else {
      await setDoc(docRef, {
        ...DEFAULT_PROFILE,
        ...updatedProfile,
      })
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
