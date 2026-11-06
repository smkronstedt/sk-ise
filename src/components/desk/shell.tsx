import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadCards } from "@/lib/cards";
import { deskModes, loadMode, saveMode, type DeskMode } from "@/lib/desk/modes";
import { syncDeviceProgress } from "@/lib/progress-sync";

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
  const navigate = useNavigate();
  const dueCount = typeof window !== "undefined" ? loadCards().filter((c) => c.due <= Date.now() && c.source !== "full").length : 0;
  const session = authClient.useSession();
  const { user, isPending } = useCurrentUserState();
  const [syncNote, setSyncNote] = useState("Saved on this device");
  const [mode, setMode] = useState<DeskMode>("classic");

  useEffect(() => {
    setMode(loadMode());
  }, [path]);

  useEffect(() => {
    if (!authEnabled || isPending || user || path === "/login") return;
    void navigate({ to: "/login" });
  }, [isPending, navigate, path, user]);

  useEffect(() => {
    if (!authEnabled || !session.data?.user) return;
    let stop = false;
    const run = () => {
      void syncDeviceProgress().then((result) => {
        if (!stop) setSyncNote(result === "synced" ? "Synced to your account" : "Saved on this device");
      });
    };
    run();
    const timer = window.setInterval(run, 30000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [session.data?.user?.id]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-navy-2 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="font-serif text-2xl leading-none tracking-tight">
            ISE Team Room
          </Link>
          <p className="hidden text-sm text-white/70 sm:block">In-service desk</p>
          <nav className="ml-auto flex flex-wrap gap-1">
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
          {authEnabled ? (
            session.data?.user ? (
              <p className="w-full text-xs text-white/70 sm:w-auto">
                {session.data.user.email} · {syncNote}
              </p>
            ) : (
              <Link to="/login" className="rounded px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10">
                Sign in
              </Link>
            )
          ) : (
            <p className="text-xs text-white/70">Saved on this device</p>
          )}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2">
            {deskModes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  saveMode(item.id);
                  setMode(item.id);
                  if (path !== "/") void navigate({ to: "/" });
                }}
                className={`min-h-11 shrink-0 rounded px-3 text-sm font-semibold ${
                  path === "/" && mode === item.id ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
