import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { ReadingView } from "@/components/ReadingView";
import { getProfile, getSession } from "@/lib/session";

export default async function ReadingPage() {
  if (!(await getSession())) redirect("/");
  const profile = await getProfile();
  if (!profile) redirect("/profile");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-moon-100">{profile.name ? `${profile.name}, here's your sky` : "Your sky"}</h1>
          <p className="mt-2 text-moon-300">
            Born {profile.dob}{profile.time ? ` at ${profile.time}` : ""} in {profile.city}.{" "}
            <Link href="/profile" className="underline">Edit details</Link>
          </p>
        </div>
        <LogoutButton />
      </div>
      <ReadingView name={profile.name} />
    </main>
  );
}
