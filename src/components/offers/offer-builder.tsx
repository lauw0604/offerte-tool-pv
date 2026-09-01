"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { calculateAnnualYield, calculateOfferTotals, type OfferLine, type OfferOrientation } from "@/lib/offer-calculations";
import { downloadOfferPdf } from "@/lib/pdf/offer-pdf";
import { EmailTextDisplay } from "./email-text-display";
import type { OfferEmailData } from "@/lib/email-generator";

type CustomerDraft = {
  name: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyCustomer: CustomerDraft = {
  name: "",
  address: "",
  postal_code: "",
  city: "",
  phone: "",
  email: "",
  notes: "",
};

const initialOfferLines: OfferLine[] = [
  {
    id: "line-1",
    productCategory: "paneel",
    description: "Monokristallijn paneel 455 Wp",
    quantity: 12,
    unitPrice: 179,
    vatRate: 0,
  },
  {
    id: "line-2",
    productCategory: "montage",
    description: "Montage en commissioning",
    quantity: 14,
    unitPrice: 82,
    vatRate: 0,
  },
];

const orientationOptions: { value: OfferOrientation; label: string }[] = [
  { value: "zuid", label: "Zuid" },
  { value: "zuidoost-zuidwest", label: "Zuidoost / Zuidwest" },
  { value: "oost-west", label: "Oost / West" },
  { value: "oost", label: "Oost" },
  { value: "west", label: "West" },
  { value: "noord", label: "Noord" },
];

export function OfferBuilder() {
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [panelCount, setPanelCount] = useState(12);
  const [wattPeak, setWattPeak] = useState(455);
  const [orientation, setOrientation] = useState<OfferOrientation>("zuid");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [splitInvoices, setSplitInvoices] = useState(false);
  const [lines, setLines] = useState<OfferLine[]>(initialOfferLines);
  const [offerNumber, setOfferNumber] = useState("2026-001");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showEmailText, setShowEmailText] = useState(false);

  const annualYield = useMemo(
    () => calculateAnnualYield(panelCount, wattPeak, orientation),
    [panelCount, wattPeak, orientation],
  );

  const totals = useMemo(
    () => calculateOfferTotals(lines, discountAmount),
    [lines, discountAmount],
  );

  async function handleSave() {
    const supabase = createBrowserSupabaseClient();
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .insert([
        {
          name: customer.name || "Onbekend",
          address: customer.address,
          postal_code: customer.postal_code,
          city: customer.city,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
        },
      ])
      .select()
      .single();

    if (customerError) {
      setSaveMessage(`Klant kon niet worden opgeslagen: ${customerError.message}`);
      return;
    }

    const validNumber = offerNumber || "2026-001";
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const { data: offerData, error: offerError } = await supabase
      .from("offertes")
      .insert([
        {
          offer_number: validNumber,
          customer_id: customerData.id,
          valid_until: validUntil.toISOString().slice(0, 10),
          status: "concept",
          roof_orientation: orientation,
          roof_pitch: 30,
          panel_count: panelCount,
          estimated_yearly_output_kwh: annualYield,
          discount_amount: discountAmount,
          intro_text: "Wij leveren een passend PV-systeem met een heldere offerte en een duidelijke installatieopzet.",
          created_by: null,
          split_invoices: splitInvoices,
        },
      ])
      .select()
      .single();

    if (offerError) {
      setSaveMessage(`Offerte kon niet worden opgeslagen: ${offerError.message}`);
      return;
    }

    const insertRows = lines.map((line, index) => ({
      offer_id: offerData.id,
      product_id: null,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      vat_rate: line.vatRate,
      sort_order: index,
    }));

    const { error: linesError } = await supabase.from("offerte_regels").insert(insertRows);
    if (linesError) {
      setSaveMessage(`Offerte-regels konden niet worden opgeslagen: ${linesError.message}`);
      return;
    }

    setSaveMessage(`Offerte ${validNumber} is opgeslagen.`);
  }

  async function handleGeneratePdf() {
    const pdfData = {
      offerNumber: offerNumber || "2026-001",
      customerName: customer.name || "Onbekend",
      customerAddress: customer.address || "",
      postcodeCity: [customer.postal_code, customer.city].filter(Boolean).join(" "),
      introText: "Wij leveren een passend PV-systeem met een heldere offerte en een duidelijke installatieopzet.",
      panelCount,
      totalWattPeak: panelCount * wattPeak,
      annualYield,
      lines: lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        productCategory: line.productCategory,
      })),
      totals: {
        subtotalA: totals.subtotalA,
        subtotalB: totals.subtotalB,
        totalExcl: totals.totalExcl,
        totalVat: totals.totalVat,
        totalIncl: totals.totalIncl,
      },
    };

    await downloadOfferPdf(pdfData, `${pdfData.offerNumber}.pdf`);
    setSaveMessage(`PDF voor ${pdfData.offerNumber} wordt gedownload.`);
  }

  function handleShowEmailText() {
    setShowEmailText(true);
  }

  function addLine() {
    setLines((current) => [
      ...current,
      {
        id: `line-${Date.now()}`,
        productCategory: "overig",
        description: "Nieuw artikel",
        quantity: 1,
        unitPrice: 0,
        vatRate: 21,
      },
    ]);
  }

  function updateLine(id: string, field: keyof OfferLine, value: string | number) {
    setLines((current) =>
      current.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]: field === "quantity" || field === "unitPrice" || field === "vatRate"
                ? Number(value)
                : value,
            }
          : line,
      ),
    );
  }

  function removeLine(id: string) {
    setLines((current) => current.filter((line) => line.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0C447C]">Offerte</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Nieuwe offerte</h1>
          </div>
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Nummer: <span className="font-semibold text-slate-900">{offerNumber}</span>
          </div>
        </div>
      </div>

      {saveMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.8fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Klantgegevens</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={customer.name}
                onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
                placeholder="Naam klant"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
              <input
                value={customer.email}
                onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                placeholder="E-mail"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
              <input
                value={customer.address}
                onChange={(event) => setCustomer((current) => ({ ...current, address: event.target.value }))}
                placeholder="Adres"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C] md:col-span-2"
              />
              <input
                value={customer.postal_code}
                onChange={(event) => setCustomer((current) => ({ ...current, postal_code: event.target.value }))}
                placeholder="Postcode"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
              <input
                value={customer.city}
                onChange={(event) => setCustomer((current) => ({ ...current, city: event.target.value }))}
                placeholder="Plaats"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
              <input
                value={customer.phone}
                onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Telefoon"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
              <textarea
                value={customer.notes}
                onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Notitie"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C] md:col-span-2"
                rows={3}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Systeemspecificatie</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="number"
                value={panelCount}
                onChange={(event) => setPanelCount(Number(event.target.value || 0))}
                placeholder="Aantal panelen"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
              <input
                type="number"
                value={wattPeak}
                onChange={(event) => setWattPeak(Number(event.target.value || 0))}
                placeholder="Wp per paneel"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
              <select
                value={orientation}
                onChange={(event) => setOrientation(event.target.value as OfferOrientation)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              >
                {orientationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                Totaal wattpiek: <strong>{panelCount * wattPeak} Wp</strong>
              </p>
              <p className="mt-1">
                Geschatte jaaropbrengst: <strong>{annualYield.toFixed(0)} kWh</strong>
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Regels</h2>
              <button
                type="button"
                onClick={addLine}
                className="rounded-xl bg-[#639922] px-4 py-2 text-sm font-semibold text-white hover:bg-[#537a1a]"
              >
                Regel toevoegen
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={line.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 md:grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
                    <input
                      value={line.description}
                      onChange={(event) => updateLine(line.id, "description", event.target.value)}
                      placeholder="Omschrijving"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[#0C447C]"
                    />
                    <select
                      value={line.productCategory}
                      onChange={(event) => updateLine(line.id, "productCategory", event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[#0C447C]"
                    >
                      <option value="paneel">Paneel</option>
                      <option value="omvormer">Omvormer</option>
                      <option value="optimizer">Optimizer</option>
                      <option value="batterij">Batterij</option>
                      <option value="laadpaal">Laadpaal</option>
                      <option value="montage">Montage</option>
                      <option value="elektra">Elektra</option>
                      <option value="overig">Overig</option>
                    </select>
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(event) => updateLine(line.id, "quantity", event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[#0C447C]"
                    />
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(event) => updateLine(line.id, "unitPrice", event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[#0C447C]"
                    />
                    <input
                      type="number"
                      value={line.vatRate}
                      onChange={(event) => updateLine(line.id, "vatRate", event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[#0C447C]"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Verwijder
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Regel {index + 1}: €{(line.quantity * line.unitPrice).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Totalen</h2>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Deel A — PV-installatie</span>
              <strong>€{totals.subtotalA.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Deel B — batterij / laadpaal / elektra</span>
              <strong>€{totals.subtotalB.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-slate-600">
              <span>Korting</span>
              <strong>€{discountAmount.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Totaal excl. btw</span>
              <strong>€{totals.totalExcl.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Btw</span>
              <strong>€{totals.totalVat.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#0C447C] px-3 py-2 text-white">
              <span>Totaal incl. btw</span>
              <strong>€{totals.totalIncl.toFixed(2)}</strong>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span>Splitsen in twee facturen</span>
              <input
                type="checkbox"
                checked={splitInvoices}
                onChange={(event) => setSplitInvoices(event.target.checked)}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Korting (€)
              <input
                type="number"
                value={discountAmount}
                min="0"
                onChange={(event) => setDiscountAmount(Number(event.target.value || 0))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
              />
            </label>

            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-xl bg-[#0C447C] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0a3863]"
            >
              Opslaan
            </button>
            <button
              type="button"
              onClick={handleGeneratePdf}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              PDF genereren
            </button>
            <button
              type="button"
              onClick={handleShowEmailText}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              E-mailtekst genereren
            </button>
          </div>
        </aside>
      </div>

      {showEmailText && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">E-mailtekst</h2>
            <button
              onClick={() => setShowEmailText(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <EmailTextDisplay
            data={{
              offerNumber: offerNumber || "2026-001",
              customerName: customer.name || "Onbekend",
              customerEmail: customer.email || "",
              totalInclVat: totals.totalIncl,
              panelCount,
              annualYield,
              validUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
                "nl-NL"
              ),
              introText:
                "Wij leveren een passend PV-systeem met een heldere offerte en een duidelijke installatieopzet.",
            }}
          />
        </div>
      )}
    </div>
  );
}

