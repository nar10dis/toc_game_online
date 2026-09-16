import { Header } from "@/components/Header"
import { paperStyle } from "@/lib/paperStyle"
import { RegisterForm } from "@/components/register-form"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col" style={paperStyle}>
      <Header />
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
