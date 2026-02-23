"use client";

import { useState } from "react";

type BlueprintResult = {
  blueprint_id: string;
  blueprint: unknown;
};

type RenderResult = {
  job_id: string;
  status: string;
  provider_payload_preview: unknown;
};

const PROVIDERS = ["sora", "veo", "runway", "kling", "talking_actor"] as const;
const PLATFORMS = ["tiktok", "meta", "youtube"] as const;
const FORMATS = ["9:16", "16:9"] as const;

export default function VideoPage() {
  // Form state
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [claimsText, setClaimsText] = useState("");
  const [personaDescription, setPersonaDescription] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("tiktok");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("9:16");
  const [durationS, setDurationS] = useState(30);
  const [provider, setProvider] =
    useState<(typeof PROVIDERS)[number]>("talking_actor");

  // Result state
  const [blueprintResult, setBlueprintResult] = useState<BlueprintResult | null>(null);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  async function handleGenerateBlueprint(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBlueprintResult(null);
    setRenderResult(null);

    const claims = claimsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: { name: productName, category, claims },
          persona: { description: personaDescription },
          platform,
          format,
          duration_s: durationS,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate blueprint");
        return;
      }

      setBlueprintResult(data as BlueprintResult);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRenderJob() {
    if (!blueprintResult) return;

    setRenderLoading(true);
    setRenderError(null);

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprint_id: blueprintResult.blueprint_id,
          provider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRenderError(data.error ?? "Failed to create render job");
        return;
      }

      setRenderResult(data as RenderResult);
    } catch (err) {
      setRenderError(String(err));
    } finally {
      setRenderLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Criar Vídeo UGC</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gere um blueprint de vídeo e envie para renderização.
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleGenerateBlueprint} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do produto
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Tênis Runner Pro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: calçados esportivos"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Claims / benefícios (um por linha)
          </label>
          <textarea
            required
            value={claimsText}
            onChange={(e) => setClaimsText(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"Amortecimento superior\nLeve e confortável\nSola antiderrapante"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição do creator (persona)
          </label>
          <input
            type="text"
            required
            value={personaDescription}
            onChange={(e) => setPersonaDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ex: Mulher jovem de São Paulo, fã de corrida, 25-30 anos"
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plataforma
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as typeof platform)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Formato
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração (s)
            </label>
            <input
              type="number"
              min={8}
              max={60}
              value={durationS}
              onChange={(e) => setDurationS(parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Gerando blueprint…" : "Gerar Blueprint"}
        </button>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}
      </form>

      {/* ── Blueprint result ── */}
      {blueprintResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Blueprint gerado{" "}
              <span className="font-mono text-xs text-gray-400">
                {blueprintResult.blueprint_id}
              </span>
            </h2>
          </div>

          <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-xs overflow-auto max-h-96">
            {JSON.stringify(blueprintResult.blueprint, null, 2)}
          </pre>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateRenderJob}
              disabled={renderLoading}
              className="bg-green-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {renderLoading ? "Criando job…" : `Criar Job de Render (${provider})`}
            </button>
          </div>

          {renderError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {renderError}
            </p>
          )}
        </div>
      )}

      {/* ── Render job result ── */}
      {renderResult && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Job de Render criado</h2>

          <div className="bg-green-50 border border-green-200 rounded px-4 py-3 text-sm space-y-1">
            <div>
              <span className="font-medium">Job ID:</span>{" "}
              <span className="font-mono text-xs">{renderResult.job_id}</span>
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-medium">
                {renderResult.status}
              </span>
            </div>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Ver provider payload
            </summary>
            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-64">
              {JSON.stringify(renderResult.provider_payload_preview, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
