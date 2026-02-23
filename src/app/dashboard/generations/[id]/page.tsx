import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Variation = {
  variation_id: string;
  hook: { text: string; type: string };
  script: { beats: string[]; duration_s: number };
  on_screen_captions: string[];
  editing_direction: {
    pacing: string;
    cuts: string;
    framing: string;
    notes: string;
  };
  cta: { type: string; text: string };
  claims_to_avoid: string[];
};

type GenerationOutput = {
  variations: Variation[];
};

type GenerationRequest = {
  id: string;
  target_platform: string;
  marketplace_context: string;
  product_name: string;
  product_category: string;
  output_count: number;
  status: string;
  output: GenerationOutput | null;
  created_at: string;
};

/**
 * Next.js 15: `params` is a Promise — it must be awaited before use.
 * The prop type must match PageProps (params: Promise<…>).
 */
export default async function GenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("generation_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const request = data as GenerationRequest;
  const variations = request.output?.variations ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/generate"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Gerar
        </Link>
        <h1 className="text-lg font-semibold">
          {request.product_name} — {variations.length} variações
        </h1>
        <span
          className={
            request.status === "DONE"
              ? "badge-done"
              : request.status === "FAILED"
              ? "badge-failed"
              : "badge-pending"
          }
        >
          {request.status}
        </span>
      </div>

      {/* Request metadata */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6 text-sm text-gray-600 flex flex-wrap gap-4">
        <span>Plataforma: <strong>{request.target_platform}</strong></span>
        <span>Marketplace: <strong>{request.marketplace_context}</strong></span>
        <span>Categoria: <strong>{request.product_category}</strong></span>
        <span>Data: <strong>{new Date(request.created_at).toLocaleDateString("pt-BR")}</strong></span>
      </div>

      {variations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-400 text-sm">
            {request.status === "FAILED"
              ? "A geração falhou. Tente novamente."
              : "Aguardando geração…"}
          </p>

          {/* Raw output fallback */}
          {request.output && (
            <pre className="mt-4 text-xs text-gray-600 bg-gray-50 rounded p-3 overflow-auto max-h-96">
              {JSON.stringify(request.output, null, 2)}
            </pre>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {variations.map((v) => (
            <VariationCard key={v.variation_id} variation={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VariationCard({ variation: v }: { variation: Variation }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-mono text-xs text-gray-400">{v.variation_id}</span>
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-0.5 rounded">{v.hook.type}</span>
          <span className="bg-gray-100 px-2 py-0.5 rounded">{v.editing_direction.pacing}</span>
          <span className="bg-gray-100 px-2 py-0.5 rounded">{v.script.duration_s}s</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Hook */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Hook
          </p>
          <p className="text-gray-800 font-medium">{v.hook.text}</p>
        </div>

        {/* Script beats */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Script ({v.script.beats.length} beats)
          </p>
          <ol className="space-y-1 list-decimal list-inside">
            {v.script.beats.map((beat, i) => (
              <li key={i} className="text-sm text-gray-700">
                {beat}
              </li>
            ))}
          </ol>
        </div>

        {/* Captions */}
        {v.on_screen_captions?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Legendas na tela
            </p>
            <div className="flex flex-wrap gap-2">
              {v.on_screen_captions.map((caption, i) => (
                <span
                  key={i}
                  className="bg-black text-white text-xs px-2 py-1 rounded font-medium"
                >
                  {caption}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            CTA
          </p>
          <p className="text-sm text-gray-700">
            <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded mr-2">
              {v.cta.type}
            </span>
            {v.cta.text}
          </p>
        </div>

        {/* Editing direction */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Direção de edição
          </p>
          <div className="flex gap-3 text-xs text-gray-500 mb-1">
            <span>Ritmo: {v.editing_direction.pacing}</span>
            <span>Cortes: {v.editing_direction.cuts}</span>
            <span>Enquadramento: {v.editing_direction.framing}</span>
          </div>
          {v.editing_direction.notes && (
            <p className="text-xs text-gray-600 italic">{v.editing_direction.notes}</p>
          )}
        </div>

        {/* Claims to avoid */}
        {v.claims_to_avoid?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Evitar afirmar
            </p>
            <div className="flex flex-wrap gap-1">
              {v.claims_to_avoid.map((claim, i) => (
                <span
                  key={i}
                  className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded"
                >
                  {claim}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
