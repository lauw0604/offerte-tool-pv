import { SignOutButton } from "@/components/auth/sign-out-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0C447C]">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Plus Min Energie</h1>
          </div>
          <SignOutButton />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">
            Ingelogd als: <span className="font-semibold">{user.email}</span>
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Fase 5 is actief: e-mailtekst generatie en overzicht van alle offertes.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/offerte"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-2 text-3xl">📝</div>
            <h2 className="font-semibold text-slate-900">Nieuwe offerte</h2>
            <p className="mt-2 text-sm text-slate-600">
              Maak een nieuwe offerte en genereer PDF en e-mail
            </p>
          </Link>

          <Link
            href="/prijslijst"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-2 text-3xl">💰</div>
            <h2 className="font-semibold text-slate-900">Prijslijst</h2>
            <p className="mt-2 text-sm text-slate-600">
              Beheer producten en importeer via CSV
            </p>
          </Link>

          <Link
            href="/overzicht"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-2 text-3xl">📊</div>
            <h2 className="font-semibold text-slate-900">Overzicht</h2>
            <p className="mt-2 text-sm text-slate-600">
              Bekijk alle offertes en update hun status
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

