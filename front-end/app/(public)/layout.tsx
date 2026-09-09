import type { Metadata } from "next"
import Link from "next/link"
import { Briefcase } from "lucide-react"

export const metadata: Metadata = {
  title: "Luilala CRM — Auth",
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center items-center h-[100vh] w-full">
      <div className="border grid w-[80%] mx-auto lg:grid-cols-2">

      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        {/* Top logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Briefcase className="size-5" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Luilala CRM</span>
        </Link>

        {/* Centre graphic / quote */}
        <div className="space-y-4">
          <blockquote className="text-2xl font-semibold leading-snug text-sidebar-foreground">
            "A platform that helps your team close deals, serve customers, and grow revenue — all in one place."
          </blockquote>
          <p className="text-sm text-muted-foreground">Luilala CRM — built for modern teams.</p>
        </div>

        {/* Bottom links */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Luilala. All rights reserved.
        </p>

        {/* Decorative circles */}
        <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 -z-0 size-72 translate-x-1/3 translate-y-1/3 rounded-full bg-sidebar-primary/10" />
        <div aria-hidden className="pointer-events-none absolute top-0 left-0 -z-0 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sidebar-accent/20" />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b px-6 py-4 lg:hidden">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Briefcase className="size-4" />
          </div>
          <span className="font-semibold">Luilala CRM</span>
        </div>

        {/* Centred form area */}
        <div className="flex flex-1 items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
