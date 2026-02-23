"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = ["meta", "tiktok", "instagram", "youtube", "other"] as const;
const MARKETPLACE_CONTEXTS = [
  "mercado_livre",
  "shopee",
  "tiktok_shop",
  "instagram",
  "none",
] as const;

export default function NewCreativePage() {
  const router = useRouter();

  const [sourcePlatform, setSourcePlatform] = useState<string>("meta");
  const [sourceUrl, setSourceUrl] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [marketplaceContext, setMarketplaceContext] =
    useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_platform: sourcePlatform,
        source_url: sourceUrl,
        product_category: productCategory,
        marketplace_context: marketplaceContext,
      }),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Erro ao criar criativo");
      return;
    }

    router.push("/dashboard/creatives");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold mb-6">Novo Criativo</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plataforma de origem
          </label>
          <select
            value={sourcePlatform}
            onChange={(e) => setSourcePlatform(e.target.value)}
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
            URL do anúncio
          </label>
          <input
            type="url"
            required
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria do produto
          </label>
          <input
            type="text"
            required
            value={productCategory}
            onChange={(e) => setProductCategory(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="ferramentas, beleza, roupas…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contexto de marketplace
          </label>
          <select
            value={marketplaceContext}
            onChange={(e) => setMarketplaceContext(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {MARKETPLACE_CONTEXTS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Salvando…" : "Criar criativo"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-400 mt-4">
        Após criar, use o botão &quot;Analisar&quot; na lista para iniciar a análise LLM.
        Você pode passar o texto do anúncio manualmente via{" "}
        <code className="bg-gray-100 px-1 rounded">POST /api/analyze</code> com{" "}
        <code className="bg-gray-100 px-1 rounded">raw_snapshot</code>.
      </p>
    </div>
  );
}
