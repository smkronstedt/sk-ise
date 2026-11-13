import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { BadgeRow } from "@/components/desk/badge";
import { useDesk } from "@/lib/desk/provider";
import { badgeElements } from "@/lib/desk/route";
import { authClient } from "@/lib/auth/client";
import { loadProfile, saveProfile } from "@/lib/account-api";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const session = authClient.useSession();
  const desk = useDesk();
  const gymBadges = badgeElements(desk.state.tests);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProfile()
      .then((profile) => {
        if (!profile) return;
        setName(profile.name);
        setBio(profile.bio);
        setImage(profile.image);
      })
      .catch(() => setError("Could not load your profile."));
  }, []);

  const onPhoto = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      setImage(canvas.toDataURL("image/jpeg", 0.72));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const save = async () => {
    setError("");
    setNote("");
    try {
      await saveProfile({ data: { name, bio, image } });
      await authClient.updateUser({ name, image: image || undefined });
      await session.refetch();
      setNote("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  };

  return (
    <Shell>
      <h1 className="font-serif text-3xl">Profile</h1>
      <p className="mt-1 text-sm text-muted">This name and photo show in the header and on the leaderboard.</p>
      <div className="mt-4 flex max-w-lg flex-col gap-4 rounded border border-line bg-paper p-4">
        <div className="flex items-center gap-4">
          {image ? (
            <img src={image} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy font-serif text-2xl text-white">
              {(name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <label className="text-sm font-semibold">
            Photo
            <input type="file" accept="image/*" onChange={(event) => onPhoto(event.target.files?.[0])} className="mt-1 block text-sm font-normal" />
          </label>
          <div>
            <p className="font-serif text-2xl">{name || "Your name"}</p>
            <BadgeRow elements={gymBadges} size="md" />
          </div>
        </div>
        <label className="text-sm font-semibold">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded border border-line px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          About you
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} maxLength={280} className="mt-1 w-full rounded border border-line px-3 py-2 font-normal" />
        </label>
        {error ? <p className="text-sm text-wrong">{error}</p> : null}
        {note ? <p className="text-sm font-semibold text-correct">{note}</p> : null}
        <button type="button" onClick={() => void save()} className="min-h-11 rounded bg-navy px-4 font-semibold text-white">
          Save profile
        </button>
      </div>
    </Shell>
  );
}
