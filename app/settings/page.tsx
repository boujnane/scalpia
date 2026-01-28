"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/user-profile"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AuthRequired from "@/components/AuthRequired"

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isPro, isAdmin } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [photoURL, setPhotoURL] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      setLoading(true)
      try {
        const userProfile = await getUserProfile(user.uid)
        setProfile(userProfile)
        setFirstName(userProfile.firstName)
        setLastName(userProfile.lastName)
        setPhotoURL(userProfile.photoURL || "")
        setPhotoPreview(userProfile.photoURL)
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading])

  const handlePhotoURLChange = (url: string) => {
    setPhotoURL(url)
    setPhotoPreview(url || null)
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setSaved(false)

    try {
      await updateUserProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photoURL: photoURL.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U"
  }

  if (authLoading || loading) {
    return (
      <AuthRequired>
        <div className="min-h-screen flex items-center justify-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <Icons.arrowRight className="h-4 w-4 rotate-180" />
              Retour
            </button>
            <h1 className="text-3xl font-bold text-foreground">Parametres</h1>
            <p className="text-muted-foreground mt-1">Gerez votre profil et vos preferences</p>
          </div>

          {/* Profile Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Profil</CardTitle>
              <CardDescription>
                Ces informations seront visibles par les autres utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-lg"
                      onError={() => setPhotoPreview(null)}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border-4 border-background shadow-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">
                        {getInitials()}
                      </span>
                    </div>
                  )}

                  {/* Pro/Admin badge */}
                  {(isPro || isAdmin) && (
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-md">
                      {isAdmin ? (
                        <Icons.shield className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Icons.sparkles className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    URL de l'image de profil
                  </label>
                  <Input
                    type="url"
                    placeholder="https://exemple.com/mon-avatar.jpg"
                    value={photoURL}
                    onChange={(e) => handlePhotoURLChange(e.target.value)}
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisez une URL d'image publique (Gravatar, imgur, etc.)
                  </p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Prenom
                  </label>
                  <Input
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nom
                  </label>
                  <Input
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas etre modifie
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Compte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Plan actuel</p>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin ? "Administrateur" : isPro ? "Pro" : "Gratuit"}
                  </p>
                </div>
                {!isPro && !isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/pricing")}
                    className="gap-2"
                  >
                    <Icons.zap className="h-4 w-4" />
                    Passer Pro
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Membre depuis</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-2 text-sm text-emerald-500">
                <Icons.check className="h-4 w-4" />
                Sauvegarde
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Icons.save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AuthRequired>
  )
}
