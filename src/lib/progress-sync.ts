import { loadProgress, saveProgress } from "@/lib/progress-api";
import { loadActivity, mergeActivity, saveActivity, type DayLog } from "@/lib/desk/activity";

const DESK = "callroom-desk-v1";
const BANK = "callroom-original-bank-v1";
const CARDS = "callroom-cards-v1";
const OPS = "callroom-ops-v1";

type Bundle = {
  desk: unknown;
  bank: unknown;
  cards: unknown;
  ops: unknown;
};

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (value == null) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function localBundle(): Bundle {
  return {
    desk: read(DESK),
    bank: read(BANK),
    cards: read(CARDS),
    ops: read(OPS),
  };
}

function hasLocalWork(bundle: Bundle) {
  const desk = bundle.desk as { tests?: unknown[] } | null;
  const bank = bundle.bank as { answers?: Record<string, unknown> } | null;
  const cards = Array.isArray(bundle.cards) ? bundle.cards : [];
  return Boolean(desk?.tests?.length || (bank?.answers && Object.keys(bank.answers).length) || cards.length || bundle.ops);
}

function apply(bundle: Bundle) {
  write(DESK, bundle.desk);
  write(BANK, bundle.bank);
  write(CARDS, bundle.cards);
  write(OPS, bundle.ops);
}

export async function syncDeviceProgress(): Promise<"synced" | "device"> {
  const local = localBundle();
  try {
    const remote = await loadProgress();
    if (!remote?.payload) {
      if (hasLocalWork(local)) {
        await saveProgress({ data: { payload: JSON.stringify(pack(local)) } });
      }
      return "synced";
    }
    const parsed = JSON.parse(remote.payload) as { desk?: unknown; bank?: unknown; cards?: unknown };
    const cardsField = parsed.cards as { list?: unknown; ops?: unknown; activity?: Record<string, DayLog> } | unknown[] | null;
    const remoteActivity = Array.isArray(cardsField) ? null : cardsField?.activity;
    saveActivity(mergeActivity(loadActivity(), remoteActivity));
    const remoteBundle: Bundle = {
      desk: parsed.desk ?? null,
      bank: parsed.bank ?? null,
      cards: Array.isArray(cardsField) ? cardsField : (cardsField?.list ?? null),
      ops: Array.isArray(cardsField) ? null : (cardsField?.ops ?? null),
    };
    if (!hasLocalWork(local) && hasLocalWork(remoteBundle)) {
      apply(remoteBundle);
      window.location.reload();
      return "synced";
    }
    await saveProgress({ data: { payload: JSON.stringify(pack(local)) } });
    return "synced";
  } catch {
    return "device";
  }
}

function pack(bundle: Bundle) {
  return {
    desk: bundle.desk ?? {},
    bank: bundle.bank ?? {},
    cards: { list: bundle.cards ?? [], ops: bundle.ops ?? null, activity: loadActivity() },
  };
}
