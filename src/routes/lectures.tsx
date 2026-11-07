import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/desk/shell";
import { lectureSections, lectures, playlists, thumb } from "@/lib/desk/lectures";

export const Route = createFileRoute("/lectures")({
  component: LecturesPage,
});

function LecturesPage() {
  const [section, setSection] = useState<(typeof lectureSections)[number] | "All">("All");
  const shown = lectures.filter((lecture) => section === "All" || lecture.section === section);
  return (
    <Shell>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">EMPIRE Urology</p>
      <h1 className="font-serif text-3xl tracking-tight">Lectures</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        The New York section lecture series and the in-service reviews. A card opens the talk on YouTube.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {playlists.map((list) => (
          <a key={list.href} href={list.href} target="_blank" rel="noreferrer" className="rounded border border-line bg-paper p-3">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Playlist</p>
            <p className="mt-1 font-semibold">{list.title}</p>
            <p className="text-sm text-muted">{list.note}</p>
          </a>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["All", ...lectureSections] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSection(name)}
            className={`min-h-11 rounded px-3 text-sm font-semibold ${section === name ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((lecture) => (
          <a key={lecture.id} href={`https://www.youtube.com/watch?v=${lecture.id}`} target="_blank" rel="noreferrer" className="overflow-hidden rounded border border-line bg-paper">
            <img src={thumb(lecture.id)} alt="" className="h-40 w-full object-cover" />
            <div className="p-3">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{lecture.section}</p>
              <p className="mt-1 font-semibold">{lecture.title}</p>
            </div>
          </a>
        ))}
      </div>
    </Shell>
  );
}
