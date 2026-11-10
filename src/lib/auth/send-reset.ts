type ResetUser = { email: string; name?: string | null };

function env(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

async function deliver(to: string, subject: string, text: string) {
  const key = env("RESEND_API_KEY");
  if (!key) throw new Error("Email is not set up on the server yet.");
  const from = env("EMAIL_FROM") || "ISE Team Room <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error("Could not send the email.");
}

/** Mail the address already stored on the account. Never a typed-in address. */
export async function sendResetPassword(
  { user, token }: { user: ResetUser; url: string; token: string },
  request?: Request,
) {
  const to = String(user.email ?? "").trim();
  if (!to.includes("@")) throw new Error("No email on file.");
  const origin = request ? new URL(request.url).origin : "https://sk-ise.vercel.app";
  const link = `${origin}/reset?token=${encodeURIComponent(token)}`;
  await deliver(
    to,
    "Reset your ISE Team Room password",
    [
      "Someone asked to reset the password for this email on ISE Team Room.",
      "If that was you, open this link. It works for one hour and only this address.",
      "",
      link,
      "",
      "If you did not ask, ignore this email. Your password stays the same.",
    ].join("\n"),
  );
}

/** Confirm the address they signed up with. The link is the one Better Auth minted. */
export async function sendVerifyEmail({ user, url }: { user: ResetUser; url: string; token: string }) {
  const to = String(user.email ?? "").trim();
  if (!to.includes("@")) throw new Error("No email on file.");
  await deliver(
    to,
    "Confirm your ISE Team Room email",
    [
      `Confirm ${to} for ISE Team Room.`,
      "Open this link. It only works for this address.",
      "After you confirm, the account can be approved.",
      "",
      url,
      "",
      "If you did not sign up, ignore this email.",
    ].join("\n"),
  );
}
