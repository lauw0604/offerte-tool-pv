"use client";

import { useState } from "react";
import {
  generateOfferEmailText,
  copyEmailToClipboard,
  downloadEmailAsText,
  type OfferEmailData,
} from "@/lib/email-generator";

interface EmailTextDisplayProps {
  data: OfferEmailData;
}

export function EmailTextDisplay({ data }: EmailTextDisplayProps) {
  const [copied, setCopied] = useState(false);
  const emailText = generateOfferEmailText(data);

  async function handleCopy() {
    try {
      await copyEmailToClipboard(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  function handleDownload() {
    downloadEmailAsText(data, `email-${data.offerNumber}.txt`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            copied
              ? "bg-emerald-100 text-emerald-700"
              : "bg-[#0C447C] text-white hover:bg-[#0a3863]"
          }`}
        >
          {copied ? "✓ Gekopieerd" : "Kopiëren naar klembord"}
        </button>
        <button
          onClick={handleDownload}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
        >
          Downloaden
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 font-mono text-sm leading-relaxed text-slate-800">
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {emailText}
        </pre>
      </div>
    </div>
  );
}
