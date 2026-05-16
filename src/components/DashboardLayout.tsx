import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Menu,
  FolderOpen,
  Store,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/categories", icon: FolderOpen, label: "Categories" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/sales", icon: ShoppingCart, label: "Sales" },
    { href: "/reports", icon: TrendingUp, label: "Reports" },
  ];

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
          <Link key={item.href} to={item.href} onClick={onNavigate}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 font-medium transition-all",
                isActive && "bg-primary/10 text-primary shadow-sm hover:bg-primary/15"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-md lg:hidden">
        <div className="container flex h-14 items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r p-0">
              <div className="border-b bg-gradient-to-br from-primary/10 to-accent/5 p-6">
                <BrandBlock compact />
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <NavLinks />
                <Button
                  variant="ghost"
                  className="mt-4 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="font-semibold">Dukan Manager</span>
        </div>
      </header>

      <div className="flex">
        <aside className="fixed inset-y-0 z-40 hidden w-64 flex-col border-r bg-card shadow-card lg:flex">
          <div className="border-b bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6">
            <BrandBlock />
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <NavLinks />
          </nav>

          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Your Dukan</p>
                <p className="text-xs text-muted-foreground">Inventory & sales</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        <main className="min-h-screen flex-1 lg:pl-64">
          <div className="container max-w-6xl py-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function BrandBlock({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.svg" alt="Dukan Manager" className={cn("shrink-0", compact ? "h-10 w-10" : "h-12 w-12")} />
      <div>
        <h1 className={cn("font-bold text-foreground", compact ? "text-lg" : "text-xl")}>
          Dukan Manager
        </h1>
        {!compact && (
          <p className="text-sm text-muted-foreground">Smart inventory for your shop</p>
        )}
      </div>
    </div>
  );
}
