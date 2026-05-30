import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { StatusFooter } from "./status-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-forge-background">
      <div className="flex flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
      <StatusFooter />
    </div>
  );
}
