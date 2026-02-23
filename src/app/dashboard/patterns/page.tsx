"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Pattern = {
  id: string;
  platform: string;
  product_category: string;
  marketplace_context: string;
  pattern_name: string;
  hook_formula: string;
  structure: string;
  why_it_works: string;
  script_skeleton: string;
  tags: string[];
  editing_notes: Record<string, unknown> | null;
};

export default function PatternsPage() {
  const supabase = createClient();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("patterns")
        .select("*")
        .order("platform")
        .order("product_category");
      setPatterns(data ?? []);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <p className="text-gray-400 text-sm">Carregando patterns…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Patterns</h1>
        <span className="text-sm text-gray-400">{patterns.length} patterns</span>
      </div>

      {patterns.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Nenhum pattern encontrado. Insira os seeds via SQL ou Supabase Studio.
        </p>
      ) : (
        <div className="space-y-3">
          {patterns.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{p.pattern_name}</span>
                  <span className="text-xs text-gray-400 capitalize">{p.platform}</span>
                  <span className="text-xs text-gray-400">{p.structure}</span>
                  {p.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-gray-300 text-xs">{expanded === p.id ? "▲" : "▼"}</span>
              </button>

              {expanded === p.id && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Fórmula do hook
                    </p>
                    <p className="text-gray-800 italic">{p.hook_formula}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Esqueleto do script
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">{p.script_skeleton}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Por que funciona
                    </p>
                    <p className="text-gray-700">{p.why_it_works}</p>
                  </div>

                  {p.editing_notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Notas de edição
                      </p>
                      <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-auto">
                        {JSON.stringify(p.editing_notes, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Categoria: {p.product_category}</span>
                    <span>Marketplace: {p.marketplace_context}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
