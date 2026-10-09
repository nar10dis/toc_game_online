import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/router"
import { cn } from "@/lib/utils"
import { readError } from "@/api/auth"

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

    // Same rule as the backend, checked here to answer without a request
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only these 3 fields: the backend ignores anything else
        body: JSON.stringify({ name, email, password }),
      })

      // The backend says what is wrong: email already used, pseudo taken, invalid email...
      if (!res.ok) {
        setError(await readError(res))
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
            maxLength={20}
            pattern="[a-zA-Z0-9_\-]{3,20}"
            title="3 to 20 letters, digits, _ or -"
            className="bg-background"
          />
          <FieldDescription>3 to 20 letters, digits, _ or -</FieldDescription>
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
