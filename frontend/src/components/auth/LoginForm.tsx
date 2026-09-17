import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/router"

import { cn } from "@/lib/utils"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/auth/PasswordInput"

export function LoginForm({
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
    const email = String(form.get("email"))
    const password = String(form.get("password"))

    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      // The backend answers 401 when the email doesn't exist or the password is wrong
      if (!res.ok) {
        setError("Wrong email or password.")
        return
      }

      // The backend has put the jwt and refresh_token cookies in the browser,
      // they are httpOnly so we never touch them here
      router.push("/menu")
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
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput id="password" name="password" required />
        </Field>
        <Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
          {/* TODO: remove once the login works, it lets us reach the game without an account */}
          <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
            Test game
          </Link>
        </Field>
        <Field>
          <Link
            href="/register"
            className="text-center text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Don&apos;t have an account?{" "}
            <span className="worn-underline">Sign up</span>
          </Link>
        </Field>
      </FieldGroup>
    </form>
  )
}
