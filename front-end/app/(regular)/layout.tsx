import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { HeaderProfile } from "@/components/header-profile"
import { AuthGuard } from "@/components/auth-guard"

export default function RegularLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TooltipProvider>
        <SidebarProvider className="h-full">
          <AppSidebar variant="regular" />
          <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background z-10">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">Portal</span>
              <div className="ml-auto">
                <HeaderProfile variant="regular" />
              </div>
            </header>
            <main className="flex-1 min-h-0 overflow-auto p-4">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  )
}
