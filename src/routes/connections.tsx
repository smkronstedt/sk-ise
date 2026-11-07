import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/desk/shell";

export const Route = createFileRoute("/connections")({
  component: ConnectionsPage,
});

const services = [
  {
    name: "Strava",
    body: "The only one of these with a sign-in a website can use. It is not turned on until a Strava API app is attached to this server. Until then, log the miles in Black Ops under Training and tag them Strava. A run is stored once, and it pays $1 a mile.",
  },
  {
    name: "Garmin Connect",
    body: "Garmin does not give a personal site a login. Push the watch to Strava, or log the workout here and tag it Garmin.",
  },
  {
    name: "TrainingPeaks",
    body: "TrainingPeaks does not offer a personal sign-in for this desk. Log the session in Training and tag it TrainingPeaks.",
  },
  {
    name: "Apple Health",
    body: "Apple Health stays on the phone. A website cannot sign into it. Log the miles or the plunge in Training and tag it Apple Health.",
  },
];

function ConnectionsPage() {
  return (
    <Shell>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Profile</p>
      <h1 className="font-serif text-3xl tracking-tight">Connections</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Nothing here talks to a real Tesla, and nothing here pretends a service is signed in when it is not. The training log in Black Ops is what pays.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {services.map((service) => (
          <div key={service.name} className="rounded border border-line bg-paper p-4">
            <h2 className="font-semibold">{service.name}</h2>
            <p className="mt-1 text-sm text-muted">{service.body}</p>
          </div>
        ))}
      </div>
      <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue">
        Open Black Ops and use Training
      </Link>
    </Shell>
  );
}
