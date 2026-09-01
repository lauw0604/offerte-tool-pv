import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OffertsOverview } from "@/components/offertes/offertes-overview";

export default async function OverzichtPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all offertes with customer data
  const { data: offertesData, error } = await supabase
    .from("offertes")
    .select(`
      id,
      offer_number,
      status,
      valid_until,
      discount_amount,
      estimated_yearly_output_kwh,
      panel_count,
      created_at,
      customer_id,
      customers (
        id,
        name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching offertes:", error);
  }

  // Transform the data to handle the customers relationship properly
  const offertes = (offertesData || []).map((offer: any) => ({
    id: offer.id,
    offer_number: offer.offer_number,
    status: offer.status,
    valid_until: offer.valid_until,
    discount_amount: offer.discount_amount,
    estimated_yearly_output_kwh: offer.estimated_yearly_output_kwh,
    panel_count: offer.panel_count,
    created_at: offer.created_at,
    customer_id: offer.customer_id,
    customers: Array.isArray(offer.customers) ? offer.customers[0] : offer.customers,
  }));

  // Fetch offer totals for each offer
  const offertesWithTotals = await Promise.all(
    offertes.map(async (offer: any) => {
      const { data: lines } = await supabase
        .from("offerte_regels")
        .select("quantity, unit_price, vat_rate")
        .eq("offer_id", offer.id);

      let totalIncl = 0;
      if (lines) {
        lines.forEach((line) => {
          const lineTotal = line.quantity * line.unit_price;
          totalIncl += lineTotal * (1 + line.vat_rate / 100);
        });
      }

      return {
        ...offer,
        totalIncl,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0C447C]">
              Overzicht
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Alle offertes</h1>
          </div>
        </div>
      </div>

      <OffertsOverview offertes={offertesWithTotals} />
    </div>
  );
}
