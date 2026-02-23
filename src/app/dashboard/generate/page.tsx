"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = ["tiktok", "meta", "instagram", "youtube", "universal"] as const;
const MARKETPLACE_CONTEXTS = [
  "mercado_livre",
  "shopee",
  "tiktok_shop",
  "instagram",
  "none",
] as const;

export default function GeneratePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    target_platform: "tiktok",
    marketplace_context: "none",
    product_category: "",
    product_name: "",
    product_description: "",
    product_bullets_raw: "",
    price: "",
    offer_frete: false,
    offer_garantia: "",
    offer_pix: false,
    target_audience: "",
    no_medical_claims: true,
    output_count: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const bullets = form.product_bullets_raw
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const offerTerms: Record<string, unknown> = {};
    if (form.offer_frete) offerTerms["frete"] = "grátis";
    if (form.offer_garantia) offerTerms["garantia"] = form.offer_garantia;
    if (form.offer_pix) offerTerms["pix"] = true;

    const payload = {
      target_platform: form.target_platform,
      marketplace_context: form.marketplace_context,
      product_category: form.product_category,
      product_name: form.product_name,
      product_description: form.product_description,
      product_bullets: bullets,
      price: form.price,
      offer_terms: offerTerms,
      target_audience: form.target_audience,
      constraints: { no_medical_claims: form.no_medical_claims },
      output_count: form.output_count,
    };

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Erro ao gerar variações");
      return;
    }

    router.push(`/dashboard/generations/${body.generation_id}`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold mb-6">Gerar Variações</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-5"
      >
        {/* Platform & Marketplace */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plataforma alvo
            </label>
            <select
              value={form.target_platform}
              onChange={(e) => update("target_platform", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace
            </label>
            <select
              value={form.marketplace_context}
              onChange={(e) => update("marketplace_context", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {MARKETPLACE_CONTEXTS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          <input
            type="text"
            required
            value={form.product_category}
            onChange={(e) => update("product_category", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="ferramentas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do produto
          </label>
          <input
            type="text"
            required
            value={form.product_name}
            onChange={(e) => update("product_name", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Serra copo bimetálica"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            required
            value={form.product_description}
            onChange={(e) => update("product_description", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            rows={3}
            placeholder="Descreva o produto…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Benefícios (um por linha)
          </label>
          <textarea
            required
            value={form.product_bullets_raw}
            onChange={(e) => update("product_bullets_raw", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
            rows={3}
            placeholder={"corta rápido\nnão empena\nserve em furadeira comum"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço
          </label>
          <input
            type="text"
            required
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="R$ 79,90"
          />
        </div>

        {/* Offer terms */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Condições da oferta</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.offer_frete}
                onChange={(e) => update("offer_frete", e.target.checked)}
              />
              Frete grátis
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.offer_pix}
                onChange={(e) => update("offer_pix", e.target.checked)}
              />
              Aceita Pix
            </label>
            <div className="flex items-center gap-1.5">
              <span>Garantia:</span>
              <input
                type="text"
                value={form.offer_garantia}
                onChange={(e) => update("offer_garantia", e.target.value)}
                className="border border-gray-300 rounded px-2 py-0.5 text-sm w-20"
                placeholder="30 dias"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Público-alvo
          </label>
          <input
            type="text"
            required
            value={form.target_audience}
            onChange={(e) => update("target_audience", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="marceneiros e DIY"
          />
        </div>

        {/* Constraints */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.no_medical_claims}
              onChange={(e) => update("no_medical_claims", e.target.checked)}
            />
            Sem alegações médicas / de saúde
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de variações
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={form.output_count}
            onChange={(e) => update("output_count", parseInt(e.target.value, 10))}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-24"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Gerando…" : "Gerar variações"}
        </button>
      </form>
    </div>
  );
}
