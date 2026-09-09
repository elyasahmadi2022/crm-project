import type { Metadata } from "next"
import "./globals.css"
import { Geist } from "next/font/google"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "@/providers/query-provider"
import { Toaster } from "@/components/ui/toast"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Luilala CRM",
  description: "Customer relationship management for modern teams.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased font-sans", geist.variable)}
    >
      <body className="h-full bg-background text-foreground overflow-hidden flex flex-col" suppressHydrationWarning>
        <QueryProvider>
          <TooltipProvider>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
