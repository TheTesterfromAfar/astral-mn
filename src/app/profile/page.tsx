import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { ProfileForm } from "@/components/ProfileForm";
import { getProfile, getSession } from "@/lib/session";

export default async function ProfilePage() {
  if (!(await getSession())) redirect("/");
  const profile = await getProfile();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-moon-100">Your birth details</h1>
          <p className="mt-2 text-moon-300">The more exact, the better the reading.</p>
        </div>
        <LogoutButton />
      </div>
      <div className="rounded-2xl border border-night-700 bg-night-900/70 p-6 backdrop-blur">
        <ProfileForm initial={profile} />
      </div>
    </main>
  );
}
