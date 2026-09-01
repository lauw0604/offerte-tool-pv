import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch offer with customer data and lines
  const { data: offer, error: offerError } = await supabase
    .from("offertes")
    .select(`
      id,
      offer_number,
      status,
      valid_until,
      discount_amount,
      panel_count,
      roof_orientation,
      estimated_yearly_output_kwh,
      intro_text,
      split_invoices,
      created_at,
      customer_id,
      customers (
        id,
        name,
        email,
        address,
        postal_code,
        city,
        phone,
        notes
      )
    `)
    .eq("id", id)
    .single();

  if (offerError || !offer) {
    redirect("/overzicht");
  }

  // Fetch offer lines
  const { data: lines } = await supabase
    .from("offerte_regels")
    .select("*")
    .eq("offer_id", id)
    .order("sort_order");

  // Calculate totals
  let totalExcl = 0;
  let totalVat = 0;
  let totalIncl = 0;

  lines?.forEach((line) => {
    const lineTotal = line.quantity * line.unit_price;
    totalExcl += lineTotal;
    const vatAmount = lineTotal * (line.vat_rate / 100);
    totalVat += vatAmount;
    totalIncl += lineTotal + vatAmount;
  });

  const customer = Array.isArray(offer.customers) ? offer.customers[0] : offer.customers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0C447C]">
            Detail
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Offerte {offer.offer_number}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Klant</h2>
            {customer ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Naam:</span> {customer.name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {customer.email}
                </p>
                <p>
                  <span className="font-semibold">Adres:</span> {customer.address}
                </p>
                <p>
                  <span className="font-semibold">Postcode:</span> {customer.postal_code}
                </p>
                <p>
                  <span className="font-semibold">Plaats:</span> {customer.city}
                </p>
                {customer.phone && (
                  <p>
                    <span className="font-semibold">Telefoon:</span> {customer.phone}
                  </p>
                )}
                {customer.notes && (
                  <p>
                    <span className="font-semibold">Notitie:</span> {customer.notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-600">Geen klantgegevens gevonden</p>
            )}
          </div>

          {/* System Specification */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Systeemspecificatie
            </h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Aantal panelen:</span> {offer.panel_count}
              </p>
              <p>
                <span className="font-semibold">Oriëntatie:</span> {offer.roof_orientation}
              </p>
              <p>
                <span className="font-semibold">Jaaropbrengst:</span>{" "}
                {offer.estimated_yearly_output_kwh?.toFixed(0)} kWh
              </p>
              <p>
                <span className="font-semibold">Intro:</span> {offer.intro_text}
              </p>
            </div>
          </div>

          {/* Offer Lines */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Regels</h2>
            <div className="space-y-3">
              {lines && lines.length > 0 ? (
                lines.map((line, index) => (
                  <div
                    key={line.id}
                    className="flex justify-between border-b border-slate-200 pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{line.description}</p>
                      <p className="text-xs text-slate-500">
                        {line.quantity}x €{line.unit_price.toFixed(2)} ({line.vat_rate}% btw)
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      €{(line.quantity * line.unit_price).toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-600">Geen regels</p>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="text-xl font-semibold text-slate-900">Totalen</h2>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Totaal excl. btw</span>
              <strong>€{totalExcl.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Btw</span>
              <strong>€{totalVat.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#0C447C] px-3 py-2 text-white">
              <span>Totaal incl. btw</span>
              <strong>€{totalIncl.toFixed(2)}</strong>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span className={`inline-block px-2 py-1 rounded ${
                  offer.status === "geaccepteerd"
                    ? "bg-emerald-100 text-emerald-700"
                    : offer.status === "verstuurd"
                      ? "bg-blue-100 text-blue-700"
                      : offer.status === "afgewezen"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                }`}>
                  {offer.status}
                </span>
              </p>
              <p>
                <span className="font-semibold">Geldig tot:</span> {new Date(offer.valid_until).toLocaleDateString("nl-NL")}
              </p>
              <p>
                <span className="font-semibold">Aangemaakt:</span> {new Date(offer.created_at).toLocaleDateString("nl-NL")}
              </p>
            </div>

            <button
              onClick={() => window.history.back()}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Terug
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
