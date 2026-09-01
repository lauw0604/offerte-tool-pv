"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Offerte = {
  id: string;
  offer_number: string;
  status: string;
  valid_until: string;
  created_at: string;
  totalIncl: number;
  customers: {
    id: string;
    name: string;
    email: string;
  } | null;
};

interface OffertsOverviewProps {
  offertes: Offerte[];
}

const statusOptions = [
  { value: "concept", label: "Concept", color: "bg-slate-100 text-slate-700" },
  { value: "verstuurd", label: "Verstuurd", color: "bg-blue-100 text-blue-700" },
  { value: "geaccepteerd", label: "Geaccepteerd", color: "bg-emerald-100 text-emerald-700" },
  { value: "afgewezen", label: "Afgewezen", color: "bg-red-100 text-red-700" },
];

export function OffertsOverview({ offertes: initialOffertes }: OffertsOverviewProps) {
  const [offertes, setOffertes] = useState<Offerte[]>(initialOffertes);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = offertes.filter((offer) => {
    const matchesStatus = filterStatus === "all" || offer.status === filterStatus;
    const matchesSearch =
      offer.offer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.customers?.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  async function handleStatusChange(offerId: string, newStatus: string) {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("offertes")
      .update({ status: newStatus })
      .eq("id", offerId);

    if (!error) {
      setOffertes((current) =>
        current.map((offer) =>
          offer.id === offerId ? { ...offer, status: newStatus } : offer
        )
      );
    }
  }

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.color || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Zoeken op offertenummer, naam of email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-[#0C447C]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-[#0C447C]"
        >
          <option value="all">Alle statussen</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
            Geen offertes gevonden
          </div>
        ) : (
          filtered.map((offer) => (
            <div
              key={offer.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {offer.offer_number}
                    </span>
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${getStatusColor(offer.status)}`}>
                      {statusOptions.find((opt) => opt.value === offer.status)?.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {offer.customers?.name || "Onbekende klant"}
                  </p>
                  {offer.customers?.email && (
                    <p className="text-xs text-slate-500">{offer.customers.email}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-600">Bedrag</p>
                  <p className="font-semibold text-slate-900">€{offer.totalIncl.toFixed(2)}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-600">Geldig tot</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(offer.valid_until).toLocaleDateString("nl-NL")}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    value={offer.status}
                    onChange={(e) => handleStatusChange(offer.id, e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0C447C]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/offerte/${offer.id}`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Bekijk
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
