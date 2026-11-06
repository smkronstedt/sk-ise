import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { authClient, authEnabled, signOut } from "@/lib/auth/client";
import { loadCards } from "@/lib/cards";
import { deskModes, loadMode, saveMode, type DeskMode } from "@/lib/desk/modes";
import { syncDeviceProgress } from "@/lib/progress-sync";

const links = [
  { to: "/", label: "Desk" },
  { to: "/bank", label: "Bank" },
  { to: "/create", label: "Build" },
  { to: "/tests", label: "Tests" },
  { to: "/log", label: "Log" },
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
  const [syncNote, setSyncNote] = useState("Saved on this device");
  const [mode, setMode] = useState<DeskMode>("classic");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMode(loadMode());
  }, [path]);

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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/10"
                  aria-label="Account menu"
                >
                  {session.data.user.image ? (
                    <img src={session.data.user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-semibold">{(session.data.user.name || "S").slice(0, 1).toUpperCase()}</span>
                  )}
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-30 mt-2 w-52 rounded border border-line bg-paper py-1 text-ink shadow">
                    <p className="px-3 py-2 text-xs text-muted">{syncNote}</p>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold hover:bg-chip">
                      Profile
                    </Link>
                    <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold hover:bg-chip">
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut("/login")}
                      className="block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-chip"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
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
          <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
            {deskModes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  saveMode(item.id);
                  setMode(item.id);
                  if (path !== "/") void navigate({ to: "/" });
                }}
                className={`inline-flex h-11 shrink-0 items-center rounded px-3 text-sm font-semibold ${
                  path === "/" && mode === item.id ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/leaderboard"
              className={`inline-flex h-11 shrink-0 items-center rounded px-3 text-sm font-semibold ${
                path === "/leaderboard" ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"
              }`}
            >
              Leaderboard
            </Link>
            <img src="/molon-labe.png" alt="Molon labe" title="Molon labe" className="h-11 w-auto shrink-0 rounded" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
