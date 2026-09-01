import { redirect } from "next/navigation";
import { OfferBuilder } from "@/components/offers/offer-builder";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OfferPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <OfferBuilder />
      </div>
    </main>
  );
}
