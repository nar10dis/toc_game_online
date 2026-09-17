import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/router"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/auth/PasswordInput"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    // form.get() reads the inputs through their name attribute
    const form = new FormData(event.currentTarget)
    const name = String(form.get("name"))
    const email = String(form.get("email"))
    const password = String(form.get("password"))

    // The backend doesn't check the length yet, so we do it here
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only these 3 fields: the backend puts the whole body into the database
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        setError("Could not create the account. The email or name may already be taken.")
        return
      }

      router.push("/login")
    } catch {
      setError("Server unreachable, try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="pseudo">Pseudo</FieldLabel>
          <Input
            id="pseudo"
            name="name"
            type="text"
            placeholder="Xxx_Melechon77"
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background"
          />
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            required
            className="bg-background"
          />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </Field>
        <Field>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Already have an account?{" "}
            <span className="worn-underline">Sign in</span>
          </Link>
        </Field>
      </FieldGroup>
    </form>
  )
}
