import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { ZodiacWheel } from "@/components/ZodiacWheel";
import { getProfile, getSession } from "@/lib/session";

export default async function Home() {
  if (await getSession()) redirect((await getProfile()) ? "/reading" : "/profile");

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2">
      <div className="order-2 lg:order-1">
        <h1 className="font-display text-5xl leading-[1.05] text-moon-100 sm:text-6xl">
          Your sky, read for today.
        </h1>
        <p className="mt-4 max-w-md text-lg text-moon-300">
          Sign in with your phone number, tell us when and where you were born, and get a horoscope and chart profile written for you.
        </p>
        <div className="mt-8 max-w-sm rounded-2xl border border-night-700 bg-night-900/70 p-6 backdrop-blur">
          <LoginForm />
        </div>
      </div>
      <div className="order-1 mx-auto w-full max-w-[22rem] lg:order-2 lg:max-w-md">
        <ZodiacWheel className="h-auto w-full" />
      </div>
    </main>
  );
}
