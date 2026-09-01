import { SignOutButton } from "@/components/auth/sign-out-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
              Overzicht
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Offertes</h1>
          </div>
          <SignOutButton />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">
            Ingelogd als: <span className="font-semibold">{user.email}</span>
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Fase 1 is actief: projectopzet, Supabase-authenticatie en de basis voor het offerte-dashboard zijn in plaats.
          </p>
        </div>
      </div>
    </main>
  );
}
