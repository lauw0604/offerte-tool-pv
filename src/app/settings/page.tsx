import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamSettings } from "@/components/settings/team-settings";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0C447C]">
            Instellingen
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Teammanagement</h1>
        </div>

        <TeamSettings />
      </div>
    </main>
  );
}
