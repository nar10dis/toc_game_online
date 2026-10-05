import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative flex items-center justify-center gap-6 px-6 py-4 font-body text-sm">
      <div
        aria-hidden
        className="worn-line pointer-events-none absolute inset-x-0 top-0 border-t border-current opacity-70"
      />
      <Link href="/privacy" className="transition-opacity hover:opacity-70">
        Privacy Policy
      </Link>
      <Link href="/terms" className="transition-opacity hover:opacity-70">
        Terms of Service
      </Link>
    </footer>
  );
}
