"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Creative = {
  id: string;
  source_platform: string;
  source_url: string;
  product_category: string;
  marketplace_context: string;
  status: string;
  hook_text: string | null;
  hook_type: string | null;
  structure: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  DONE: "Analisado",
  FAILED: "Falhou",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "badge-pending",
  DONE: "badge-done",
  FAILED: "badge-failed",
};

/**
 * Display label for a stored platform value.
 * Legacy rows may have "instagram" stored; show them as "Meta" too.
 */
function platformLabel(p: string): string {
  if (p === "meta" || p === "instagram") return "Meta";
  if (p === "tiktok") return "TikTok";
  if (p === "youtube") return "YouTube";
  if (p === "universal") return "Universal";
  return p;
}

export default function CreativesPage() {
  const supabase = createClient();

  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const fetchCreatives = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("creatives")
      .select(
        "id, source_platform, source_url, product_category, marketplace_context, status, hook_text, hook_type, structure, created_at"
      )
      .order("created_at", { ascending: false });

    if (platformFilter) {
      // "meta" filter also catches legacy "instagram" rows
      if (platformFilter === "meta") {
        query = query.in("source_platform", ["meta", "instagram"]);
      } else {
        query = query.eq("source_platform", platformFilter);
      }
    }
    if (categoryFilter) query = query.ilike("product_category", `%${categoryFilter}%`);
    if (statusFilter) query = query.eq("status", statusFilter);

    const { data } = await query;
    setCreatives(data ?? []);
    setLoading(false);
  }, [platformFilter, categoryFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCreatives();
  }, [fetchCreatives]);

  async function handleAnalyze(id: string) {
    setAnalyzingId(id);
    setAnalyzeError(null);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creative_id: id }),
    });

    setAnalyzingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAnalyzeError(body.error ?? "Erro ao analisar criativo");
    } else {
      fetchCreatives();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Criativos</h1>
        <Link
          href="/dashboard/creatives/new"
          className="bg-blue-600 text-white text-sm rounded px-3 py-1.5 hover:bg-blue-700"
        >
          + Novo criativo
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="border border-gray-300 rounded text-sm px-2 py-1"
        >
          <option value="">Todas as plataformas</option>
          {/* "meta" value also catches legacy "instagram" rows — see fetchCreatives */}
          <option value="meta">Meta (Facebook / Instagram)</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="other">Outro</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded text-sm px-2 py-1"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="DONE">Analisado</option>
          <option value="FAILED">Falhou</option>
        </select>

        <input
          type="text"
          placeholder="Filtrar por categoria…"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded text-sm px-2 py-1"
        />
      </div>

      {analyzeError && (
        <div className="mb-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
          {analyzeError}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Carregando…</p>
      ) : creatives.length === 0 ? (
        <p className="text-gray-400 text-sm">Nenhum criativo encontrado.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2 font-medium">Plataforma</th>
                <th className="text-left px-4 py-2 font-medium">Categoria</th>
                <th className="text-left px-4 py-2 font-medium">Marketplace</th>
                <th className="text-left px-4 py-2 font-medium">Hook</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {creatives.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2">{platformLabel(c.source_platform)}</td>
                  <td className="px-4 py-2">{c.product_category}</td>
                  <td className="px-4 py-2">{c.marketplace_context}</td>
                  <td className="px-4 py-2 max-w-xs">
                    <span className="text-gray-700 truncate block" title={c.hook_text ?? ""}>
                      {c.hook_text
                        ? `${c.hook_text.slice(0, 60)}…`
                        : <span className="text-gray-300">—</span>}
                    </span>
                    {c.hook_type && (
                      <span className="text-xs text-gray-400">{c.hook_type}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={STATUS_CLASS[c.status] ?? "text-gray-500"}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">
                    {c.status === "PENDING" || c.status === "FAILED" ? (
                      <button
                        onClick={() => handleAnalyze(c.id)}
                        disabled={analyzingId === c.id}
                        className="text-blue-600 hover:text-blue-800 text-xs disabled:opacity-50"
                      >
                        {analyzingId === c.id ? "Analisando…" : "Analisar"}
                      </button>
                    ) : (
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Ver anúncio
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
