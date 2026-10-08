import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ProfileAccount({
  email = "",
  onChangePassword,
  onLogout,
  onDeleteAccount,
}: {
  email?: string;
  onChangePassword?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}) {
  return (
    <section className="w-full max-w-md">
      <h2 className="font-heading text-xl font-bold">Account</h2>
      <p className="font-body text-sm text-muted-foreground">Only visible to you.</p>

      <div className="mt-4 flex flex-col">
        <AccountRow label="Email">
          <span className="truncate">{email}</span>
        </AccountRow>
        <Separator />
        <AccountRow label="Password">
          <span aria-label="Hidden password" className="tracking-widest">
            ••••••••
          </span>
          <Button variant="link" onClick={onChangePassword} className="h-auto px-0 text-sm">
            Change
          </Button>
        </AccountRow>
      </div>

      <div className="mt-6 flex justify-between gap-2">
        <Button variant="outline" onClick={onLogout}>
          Log out
        </Button>
        <Button variant="destructive" onClick={onDeleteAccount}>
          Delete account
        </Button>
      </div>
    </section>
  );
}

function AccountRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 font-body">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-4 text-base">{children}</div>
    </div>
  );
}
