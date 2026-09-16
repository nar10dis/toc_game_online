import Link from "next/link"

import { cn } from "@/lib/utils"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" required />
        </Field>
        <Field>
          <Button type="submit">Login</Button>
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
            <span className="underline underline-offset-4">Sign up</span>
          </Link>
        </Field>
      </FieldGroup>
    </form>
  )
}
