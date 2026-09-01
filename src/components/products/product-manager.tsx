"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DEFAULT_PRODUCTS, type Product, type ProductCategory } from "@/lib/product-catalog";

const categoryOptions: ProductCategory[] = [
  "paneel",
  "omvormer",
  "optimizer",
  "batterij",
  "laadpaal",
  "montage",
  "elektra",
  "overig",
];

const unitOptions = ["stuk", "uur", "set", "meter"] as const;

const initialForm = {
  category: "paneel" as ProductCategory,
  brand: "",
  description: "",
  unit: "stuk" as Product["unit"],
  purchase_price: "",
  selling_price: "",
  vat_rate: "0",
  watt_peak: "",
  capacity_kwh: "",
  active: true,
};

function normalizeProduct(row: any): Product {
  return {
    id: row.id ?? undefined,
    category: (row.category ?? "overig") as ProductCategory,
    brand: row.brand ?? "",
    description: row.description ?? "",
    unit: row.unit ?? "stuk",
    purchase_price: Number(row.purchase_price ?? 0),
    selling_price: Number(row.selling_price ?? 0),
    vat_rate: Number(row.vat_rate ?? 0),
    watt_peak: row.watt_peak === null || row.watt_peak === undefined ? null : Number(row.watt_peak),
    capacity_kwh: row.capacity_kwh === null || row.capacity_kwh === undefined ? null : Number(row.capacity_kwh),
    active: row.active !== false,
  };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

function parseCsvRows(raw: string): string[][] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map(parseCsvLine);
}

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase.from("products").select("*").order("category").order("brand");
      if (fetchError) {
        throw fetchError;
      }

      setProducts((data ?? []).map(normalizeProduct));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Kon producten niet laden.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [supabase]);

  function updateForm<T extends keyof typeof form>(field: T, value: (typeof form)[T]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAddProduct() {
    setError(null);
    setNotice(null);

    const payload: Product = {
      category: form.category,
      brand: form.brand.trim(),
      description: form.description.trim(),
      unit: form.unit,
      purchase_price: Number(form.purchase_price || 0),
      selling_price: Number(form.selling_price || 0),
      vat_rate: Number(form.vat_rate || 0),
      watt_peak: form.watt_peak ? Number(form.watt_peak) : null,
      capacity_kwh: form.capacity_kwh ? Number(form.capacity_kwh) : null,
      active: form.active,
    };

    if (!payload.brand || !payload.description) {
      setError("Merk en omschrijving zijn verplicht.");
      return;
    }

    setSaving(true);

    try {
      const { error: insertError } = await supabase.from("products").insert([payload]);
      if (insertError) {
        throw insertError;
      }

      setForm(initialForm);
      setNotice("Product toegevoegd aan de prijslijst.");
      await loadProducts();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Product kon niet worden toegevoegd.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(product: Product) {
    try {
      const { error } = await supabase
        .from("products")
        .update({ active: !product.active })
        .eq("id", product.id);

      if (error) {
        throw error;
      }

      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, active: !item.active } : item)),
      );
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Status kon niet worden bijgewerkt.";
      setError(message);
    }
  }

  async function handleInlineSave(product: Product) {
    if (!product.id) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({
          category: product.category,
          brand: product.brand,
          description: product.description,
          unit: product.unit,
          purchase_price: Number(product.purchase_price || 0),
          selling_price: Number(product.selling_price || 0),
          vat_rate: Number(product.vat_rate || 0),
          watt_peak: product.watt_peak ?? null,
          capacity_kwh: product.capacity_kwh ?? null,
          active: product.active,
        })
        .eq("id", product.id);

      if (error) {
        throw error;
      }

      setNotice("Wijzigingen opgeslagen.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Opslaan mislukt.";
      setError(message);
    }
  }

  async function handleSeedDefaults() {
    setError(null);
    setNotice(null);

    try {
      const { data: existingProducts, error: existingError } = await supabase.from("products").select("id");
      if (existingError) {
        throw existingError;
      }

      if ((existingProducts ?? []).length > 0) {
        setNotice("De prijslijst bevat al producten. Er is niets toegevoegd.");
        await loadProducts();
        return;
      }

      const { error: insertError } = await supabase.from("products").insert(
        DEFAULT_PRODUCTS.map((product) => ({
          ...product,
          watt_peak: product.watt_peak ?? null,
          capacity_kwh: product.capacity_kwh ?? null,
        })),
      );

      if (insertError) {
        throw insertError;
      }

      setNotice("Standaard productlijst geladen.");
      await loadProducts();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Seed kon niet worden geladen.";
      setError(message);
    }
  }

  async function handleCsvImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const content = await file.text();
      const rows = parseCsvRows(content);
      if (rows.length < 2) {
        throw new Error("CSV bevat geen dataregels.");
      }

      const [headers, ...values] = rows;
      const headerMap = headers.map((header) => header.toLowerCase().trim());

      const normalizedRows = values.map((row) => {
        const record: Record<string, string> = {};
        headerMap.forEach((header, index) => {
          record[header] = row[index] ?? "";
        });

        return {
          category: (record.category ?? "overig").toLowerCase(),
          brand: record.merk ?? record.brand ?? "",
          description: record.omschrijving ?? record.description ?? "",
          unit: (record.eenheid ?? "stuk").toLowerCase(),
          purchase_price: Number(record.inkoopprijs ?? record.purchase_price ?? 0),
          selling_price: Number(record.verkoopprijs ?? record.selling_price ?? 0),
          vat_rate: Number(record.btw_tarief ?? record.vat_rate ?? 0),
          watt_peak: record.vermogen_wp || record.watt_peak ? Number(record.vermogen_wp || record.watt_peak || 0) : null,
          capacity_kwh: record.capaciteit_kwh || record.capacity_kwh ? Number(record.capaciteit_kwh || record.capacity_kwh || 0) : null,
          active: ["ja", "true", "1", "yes"].includes((record.actief ?? record.active ?? "ja").toLowerCase()),
        };
      });

      const validRows = normalizedRows.filter((row) => row.brand && row.description && row.category);
      if (!validRows.length) {
        throw new Error("Geen geldige regels gevonden in het CSV-bestand.");
      }

      const { error: insertError } = await supabase.from("products").insert(
        validRows.map((row) => ({
          category: row.category,
          brand: row.brand,
          description: row.description,
          unit: row.unit,
          purchase_price: Number(row.purchase_price || 0),
          selling_price: Number(row.selling_price || 0),
          vat_rate: Number(row.vat_rate || 0),
          watt_peak: row.watt_peak && !Number.isNaN(row.watt_peak) ? row.watt_peak : null,
          capacity_kwh: row.capacity_kwh && !Number.isNaN(row.capacity_kwh) ? row.capacity_kwh : null,
          active: row.active,
        })),
      );

      if (insertError) {
        throw insertError;
      }

      setNotice(`${validRows.length} products geïmporteerd.`);
      event.target.value = "";
      await loadProducts();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "CSV import mislukt.";
      setError(message);
    }
  }

  const totalProducts = products.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0C447C]">Prijslijst</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Beheer producten</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="rounded-xl border border-[#0C447C] bg-white px-4 py-2 text-sm font-medium text-[#0C447C] transition hover:bg-slate-50"
          >
            Vul standaardlijst
          </button>

          <label className="inline-flex cursor-pointer rounded-xl bg-[#639922] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#537a1a]">
            CSV importeren
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Nieuw product</h2>
          <span className="text-sm text-slate-500">{totalProducts} producten</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={form.category}
            onChange={(event) => updateForm("category", event.target.value as ProductCategory)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <input
            value={form.brand}
            onChange={(event) => updateForm("brand", event.target.value)}
            placeholder="Merk"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          />

          <input
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="Omschrijving"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C] md:col-span-2"
          />

          <select
            value={form.unit}
            onChange={(event) => updateForm("unit", event.target.value as Product["unit"])}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          >
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.purchase_price}
            onChange={(event) => updateForm("purchase_price", event.target.value)}
            placeholder="Inkoopprijs"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.selling_price}
            onChange={(event) => updateForm("selling_price", event.target.value)}
            placeholder="Verkoopprijs"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.vat_rate}
            onChange={(event) => updateForm("vat_rate", event.target.value)}
            placeholder="Btw"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.watt_peak}
            onChange={(event) => updateForm("watt_peak", event.target.value)}
            placeholder="Wp"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.capacity_kwh}
            onChange={(event) => updateForm("capacity_kwh", event.target.value)}
            placeholder="kWh"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-[#0C447C]"
          />

          <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateForm("active", event.target.checked)}
            />
            Actief
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleAddProduct}
            disabled={saving}
            className="rounded-xl bg-[#639922] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#537a1a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Opslaan..." : "Product toevoegen"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Categorie</th>
                <th className="px-4 py-3 font-semibold">Merk</th>
                <th className="px-4 py-3 font-semibold">Omschrijving</th>
                <th className="px-4 py-3 font-semibold">Eenheid</th>
                <th className="px-4 py-3 font-semibold">Inkoop</th>
                <th className="px-4 py-3 font-semibold">Verkoop</th>
                <th className="px-4 py-3 font-semibold">BTW</th>
                <th className="px-4 py-3 font-semibold">Wp</th>
                <th className="px-4 py-3 font-semibold">kWh</th>
                <th className="px-4 py-3 font-semibold">Actief</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Producten laden...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Nog geen producten beschikbaar.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id ?? `${product.brand}-${product.description}`} className="border-t border-slate-200">
                    <td className="px-4 py-3 align-top">
                      <select
                        value={product.category}
                        onChange={(event) => {
                          const nextValue = event.target.value as ProductCategory;
                          setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, category: nextValue } : item)));
                        }}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      >
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        value={product.brand}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, brand: event.target.value } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        value={product.description}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, description: event.target.value } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={product.unit}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, unit: event.target.value as Product["unit"] } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.purchase_price}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, purchase_price: Number(event.target.value || 0) } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.selling_price}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, selling_price: Number(event.target.value || 0) } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.vat_rate}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, vat_rate: Number(event.target.value || 0) } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.watt_peak ?? ""}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, watt_peak: event.target.value === "" ? null : Number(event.target.value) } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.capacity_kwh ?? ""}
                        onChange={(event) => setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, capacity_kwh: event.target.value === "" ? null : Number(event.target.value) } : item)))}
                        onBlur={() => void handleInlineSave(product)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-[#0C447C]"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(product)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                      >
                        {product.active ? "Actief" : "Inactief"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
