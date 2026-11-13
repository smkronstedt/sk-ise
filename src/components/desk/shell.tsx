import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { authClient, authEnabled, signOut } from "@/lib/auth/client";
import { myAccess, type AccessStatus } from "@/lib/access-api";
import { loadCards } from "@/lib/cards";
import { Cover, Waiting } from "@/components/desk/cover";
import { DAILY_GOAL, lifetimeCorrect, prizeStatus } from "@/lib/desk/activity";
import { cashForMode } from "@/lib/desk/purse";
import { deskModes, loadMode, saveMode, type DeskMode } from "@/lib/desk/modes";
import { syncDeviceProgress } from "@/lib/progress-sync";
import { challengeBoard } from "@/lib/challenges-api";
import { BadgeRow } from "@/components/desk/badge";
import { useDesk } from "@/lib/desk/provider";
import { badgeElements } from "@/lib/desk/route";

const study = [
  { to: "/bank", label: "Bank" },
  { to: "/create", label: "Build" },
  { to: "/tests", label: "Tests" },
  { to: "/booklets", label: "Booklets" },
  { to: "/uds", label: "Urodynamics" },
  { to: "/items", label: "Items" },
] as const;

const links = [
  { to: "/", label: "Desk" },
  { to: "/log", label: "Log" },
  { to: "/guidelines", label: "Guidelines" },
  { to: "/lectures", label: "Lectures" },
  { to: "/cards", label: "Cards" },
] as const;

/** Stop database checks after this much quiet time, so Neon can sleep. */
const IDLE_MS = 2 * 60 * 1000;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const dueCount = typeof window !== "undefined" ? loadCards().filter((c) => c.due <= Date.now() && c.source !== "full").length : 0;
  const session = authClient.useSession();
  const desk = useDesk();
  const gymBadges = badgeElements(desk.state.tests);
  const [syncNote, setSyncNote] = useState("Saved on this device");
  const [mode, setMode] = useState<DeskMode>("classic");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tally, setTally] = useState({ correct: 0, money: 0, today: 0 });
  const [access, setAccess] = useState<AccessStatus | "unknown">("unknown");
  const [admin, setAdmin] = useState(false);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [studyOpen, setStudyOpen] = useState(false);

  useEffect(() => {
    const read = () => {
      const prizes = prizeStatus();
      const money = cashForMode(loadMode());
      setTally({ correct: lifetimeCorrect(), money, today: prizes.today });
    };
    read();
    window.addEventListener("ise-activity", read);
    window.addEventListener("ise-progress", read);
    window.addEventListener("ise-mode", read);
    return () => {
      window.removeEventListener("ise-activity", read);
      window.removeEventListener("ise-progress", read);
      window.removeEventListener("ise-mode", read);
    };
  }, []);

  useEffect(() => {
    setMode(loadMode());
  }, [path]);

  useEffect(() => {
    if (!authEnabled) return;
    const id = session.data?.user?.id;
    if (!id) return;
    let stop = false;
    void myAccess()
      .then((result) => {
        if (stop) return;
        setAccess(result.status);
        setAdmin(result.admin);
      })
      .catch(() => {
        if (!stop) setAccess("approved");
      });
    return () => {
      stop = true;
    };
  }, [session.data?.user?.id]);

  useEffect(() => {
    if (!authEnabled || !session.data?.user || access !== "approved") return;
    let stop = false;
    const userId = session.data.user.id;
    let lastActive = Date.now();
    const quiet = () => document.visibilityState !== "visible" || Date.now() - lastActive > IDLE_MS;
    const run = () => {
      if (quiet()) return;
      void syncDeviceProgress(userId).then((result) => {
        if (!stop) setSyncNote(result === "synced" ? "Synced to your account" : "Saved on this device");
      });
    };
    run();
    const timer = window.setInterval(run, 30000);
    let debounce = 0;
    const kick = () => {
      lastActive = Date.now();
      window.clearTimeout(debounce);
      debounce = window.setTimeout(run, 700);
    };
    const poke = () => {
      const wasQuiet = quiet();
      lastActive = Date.now();
      if (wasQuiet && document.visibilityState === "visible") run();
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      lastActive = Date.now();
      run();
    };
    for (const name of ["pointerdown", "keydown", "touchstart"] as const) {
      window.addEventListener(name, poke);
    }
    window.addEventListener("ise-progress", kick);
    window.addEventListener("ise-activity", kick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      window.clearTimeout(debounce);
      for (const name of ["pointerdown", "keydown", "touchstart"] as const) {
        window.removeEventListener(name, poke);
      }
      window.removeEventListener("ise-progress", kick);
      window.removeEventListener("ise-activity", kick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session.data?.user?.id, access]);

  const lastActive = useRef(Date.now());
  useEffect(() => {
    const mark = () => {
      lastActive.current = Date.now();
    };
    for (const name of ["pointerdown", "keydown", "touchstart"] as const) {
      window.addEventListener(name, mark);
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") lastActive.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      for (const name of ["pointerdown", "keydown", "touchstart"] as const) {
        window.removeEventListener(name, mark);
      }
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const userId = session.data?.user?.id;
    if (!userId) return;
    let stop = false;
    const load = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastActive.current > IDLE_MS) return;
      void challengeBoard()
        .then((board) => {
          if (!stop) setPendingChallenges(board.pending);
        })
        .catch(() => {
          if (!stop) setPendingChallenges(0);
        });
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [session.data?.user?.id]);

  const signedIn = Boolean(session.data?.user);
  const open = !authEnabled || (signedIn && access === "approved");
  const waiting = authEnabled && signedIn && access === "pending";
  const denied = authEnabled && signedIn && access === "denied";
  const loadingGate = authEnabled && signedIn && access === "unknown";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-navy-2 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-x-2 px-3 py-2">
          <Link to="/" className="shrink-0 font-blackletter text-2xl leading-none text-white">
            ISE Team Room
          </Link>
          <p className="hidden shrink-0 items-center gap-1 text-xs text-white/70 xl:flex">
            Team Guys only X
            <img src="/ops/bone-frog.png" alt="" className="h-6 w-10 object-contain" />
          </p>
          <nav className={`ml-auto flex shrink-0 flex-nowrap gap-0.5 ${open ? "" : "hidden"}`}>
            <Link
              to="/"
              className={`whitespace-nowrap rounded px-2 py-1.5 text-sm font-semibold ${path === "/" ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"}`}
            >
              Desk
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStudyOpen((value) => !value)}
                className={`whitespace-nowrap rounded px-2 py-1.5 text-sm font-semibold ${study.some((item) => (item.to === "/tests" ? path === "/tests" || path.startsWith("/test/") : path === item.to)) ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"}`}
              >
                Study
              </button>
              {studyOpen ? (
                <div className="absolute left-0 z-30 mt-1 w-40 rounded border border-line bg-paper py-1 text-ink shadow">
                  {study.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setStudyOpen(false)}
                      className={`block px-3 py-2 text-sm font-semibold hover:bg-chip ${path === item.to || (item.to === "/tests" && path.startsWith("/test/")) ? "bg-chip" : ""}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            {links.filter((link) => link.to !== "/").map((link) => {
              const on = path === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`whitespace-nowrap rounded px-2 py-1.5 text-sm font-semibold ${on ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"}`}
                >
                  {link.label}
                  {link.to === "/cards" && dueCount > 0 ? <span className="ml-1 text-xs">{dueCount}</span> : null}
                </Link>
              );
            })}
            {session.data?.user?.email?.toLowerCase() === "shane.kronstedt@bcm.edu" ? (
              <Link
                to="/fellowship"
                className={`whitespace-nowrap rounded px-2 py-1.5 text-sm font-semibold ${path === "/fellowship" ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"}`}
              >
                Fellowship
              </Link>
            ) : null}
          </nav>
          {open ? (
          <p className="shrink-0 whitespace-nowrap text-xs font-semibold leading-none">
            {tally.correct} correct
            <span className="mx-1 text-white/40">·</span>
            {mode === "ops" ? `Ops $${tally.money}` : mode === "notes" ? `Quest $${tally.money}` : `$${tally.money}`}
            <span className="mx-1 text-white/40">·</span>
            <span className="text-white/70">Today {tally.today}/{DAILY_GOAL}</span>
          </p>
          ) : null}
          {authEnabled ? (
            session.data?.user ? (
              <div className="flex items-center gap-2">
                <BadgeRow elements={gymBadges} />
                <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/10"
                  aria-label="Account menu"
                >
                  {session.data.user.image ? (
                    <img src={session.data.user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-blackletter text-2xl leading-none">{(session.data.user.name || "S").slice(0, 1).toUpperCase()}</span>
                  )}
                </button>
                {pendingChallenges > 0 ? <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#c45c4a]" /> : null}
                {menuOpen ? (
                  <div className="absolute right-0 z-30 mt-2 w-52 rounded border border-line bg-paper py-1 text-ink shadow">
                    <p className="px-3 py-2 text-xs text-muted">{syncNote}</p>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold hover:bg-chip">
                      Profile
                    </Link>
                    <Link to="/notifications" onClick={() => setMenuOpen(false)} className={`block px-3 py-2 text-sm font-semibold hover:bg-chip ${path === "/notifications" ? "bg-chip" : ""}`}>
                      Notifications{pendingChallenges > 0 ? ` ${pendingChallenges}` : ""}
                    </Link>
                    <Link to="/connections" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold hover:bg-chip">
                      Connections
                    </Link>
                    <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold hover:bg-chip">
                      Settings
                    </Link>
                    {admin ? (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold hover:bg-chip">
                        Admin
                      </Link>
                    ) : null}
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
                <svg viewBox="0 0 210 78" aria-label="Molon labe" className="h-8 w-auto shrink-0 rounded bg-[#f3efe6]">
                  <g fill="none" stroke="#1a1814" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 30 L22 10 L30 26 L38 10 L46 30" />
                    <circle cx="64" cy="20" r="10" />
                    <path d="M82 30 L94 10 L106 30" />
                    <path d="M116 16 C116 8 142 8 142 16 L142 24 M112 30 L120 22 M138 22 L146 30" />
                    <path d="M156 10 L156 30 L176 10 L176 30" />
                    <path d="M48 66 L60 46 L72 66" />
                    <path d="M82 66 L94 46 L106 66 M86 58 H102" />
                    <path d="M116 46 L116 66 M116 46 H128 L134 52 L128 56 H116 M116 56 H130 L136 61 L128 66 H116" />
                    <path d="M148 46 H166 M148 46 V66 M148 56 H162 M148 66 H166" />
                  </g>
                </svg>
              </div>
            ) : (
              <Link to="/login" search={{ mode: "signin" }} className="rounded px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10">
                Sign in
              </Link>
            )
          ) : (
            <p className="text-xs text-white/70">Saved on this device</p>
          )}
        </div>
        {open ? (
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
            <img src="/molon-labe.png" alt="Molon labe" className="h-11 w-auto shrink-0 rounded" />
          </div>
        </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5">
        {path === "/login" && !signedIn
          ? children
          : loadingGate
            ? <p>Opening…</p>
            : waiting
              ? <Waiting name={session.data?.user?.name ?? ""} />
              : denied
                ? <p>This account is closed.</p>
                : open
                  ? children
                  : <Cover />}
      </main>
    </div>
  );
}
