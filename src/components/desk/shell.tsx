import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { loadCards } from "@/lib/cards";

const links = [
  { to: "/", label: "Desk" },
  { to: "/bank", label: "Bank" },
  { to: "/create", label: "Build" },
  { to: "/tests", label: "Tests" },
  { to: "/items", label: "Items" },
  { to: "/guidelines", label: "Guidelines" },
  { to: "/booklets", label: "Booklets" },
  { to: "/cards", label: "Cards" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const dueCount = typeof window !== "undefined" ? loadCards().filter((c) => c.due <= Date.now() && c.source !== "full").length : 0;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-navy-2 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="font-serif text-2xl leading-none tracking-tight">
            Call Room
          </Link>
          <p className="hidden text-sm text-white/70 sm:block">In-service desk</p>
          <nav className="ml-auto flex gap-1">
            {links.map((link) => {
              const on = link.to === "/tests" ? path === "/tests" || path.startsWith("/test/") : path === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded px-3 py-2 text-sm font-semibold ${on ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"}`}
                >
                  {link.label}
                  {link.to === "/cards" && dueCount > 0 ? <span className="ml-1 text-xs">{dueCount}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
