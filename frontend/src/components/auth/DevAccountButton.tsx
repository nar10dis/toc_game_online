import { useState } from "react"
import { useRouter } from "next/router"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

// DEV ONLY: creates a random account and logs in with it in one click.
// Handy to open several browsers and test multiplayer quickly.
export function DevAccountButton() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Next replaces process.env.NODE_ENV at build time, so this button
  // doesn't exist at all in a production build
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  async function handleClick() {
    setError(null)
    setLoading(true)

    const id = Math.random().toString(36).slice(2, 8)
    const name = "dev_" + id
    const email = name + "@dev.local"
    const password = "devpassword"

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      if (!registerRes.ok) {
        setError("Dev register failed.")
        return
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!loginRes.ok) {
        setError("Dev login failed.")
        return
      }

      router.push("/menu")
    } catch {
      setError("Server unreachable, try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && <FieldError>{error}</FieldError>}
      <Button type="button" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? "Creating..." : "[DEV] Random account"}
      </Button>
    </>
  )
}
