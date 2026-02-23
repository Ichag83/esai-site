"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_PLATFORMS: { label: string; value: string }[] = [
  { label: "TikTok", value: "tiktok" },
  { label: "Meta (Facebook / Instagram)", value: "meta" },
  { label: "YouTube", value: "youtube" },
  { label: "Universal", value: "universal" },
];

const MARKETPLACE_CONTEXTS = [
  "mercado_livre",
  "shopee",
  "tiktok_shop",
  "instagram",
  "none",
] as const;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedType = (typeof ACCEPTED_TYPES)[number];
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

type FileState = {
  key: string; // stable local ID
  file: File;
  previewUrl: string;
  status: "idle" | "uploading" | "done" | "error";
  progress: number; // 0-100
  path?: string;
  errorMsg?: string;
};

type ProductForm = {
  product_name: string;
  product_category: string;
  product_description: string;
  product_bullets_raw: string;
  price: string;
  offer_frete: boolean;
  offer_garantia: string;
  offer_pix: boolean;
  target_audience: string;
  no_medical_claims: boolean;
};

type GenForm = {
  target_platform: string;
  marketplace_context: string;
  output_count: number;
};

// ─── XHR upload with progress ────────────────────────────────────────────────

function xhrPut(
  url: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed: HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "Produto" },
    { n: 2, label: "Fotos" },
    { n: 3, label: "Gerar" },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                current === n
                  ? "border-blue-600 bg-blue-600 text-white"
                  : current > n
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 bg-white text-gray-400"
              }`}
            >
              {current > n ? "✓" : n}
            </div>
            <span
              className={`text-xs mt-1 ${
                current === n ? "text-blue-600 font-medium" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 w-12 mx-1 mb-4 ${
                current > n ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Product info ─────────────────────────────────────────────────────

function Step1Product({
  form,
  onChange,
  onNext,
  loading,
  error,
}: {
  form: ProductForm;
  onChange: (f: Partial<ProductForm>) => void;
  onNext: () => void;
  loading: boolean;
  error: string | null;
}) {
  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {field(
        "Nome do produto *",
        <input
          type="text"
          required
          value={form.product_name}
          onChange={(e) => onChange({ product_name: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Serra copo bimetálica"
        />
      )}

      {field(
        "Categoria *",
        <input
          type="text"
          required
          value={form.product_category}
          onChange={(e) => onChange({ product_category: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="ferramentas"
        />
      )}

      {field(
        "Descrição *",
        <textarea
          required
          value={form.product_description}
          onChange={(e) => onChange({ product_description: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={3}
          placeholder="Descreva o produto em 1-3 frases…"
        />
      )}

      {field(
        "Benefícios — um por linha *",
        <textarea
          required
          value={form.product_bullets_raw}
          onChange={(e) => onChange({ product_bullets_raw: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          rows={3}
          placeholder={"corta rápido\nnão empena\nserve em furadeira comum"}
        />
      )}

      {field(
        "Preço *",
        <input
          type="text"
          required
          value={form.price}
          onChange={(e) => onChange({ price: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="R$ 79,90"
        />
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Condições da oferta</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.offer_frete}
              onChange={(e) => onChange({ offer_frete: e.target.checked })}
            />
            Frete grátis
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.offer_pix}
              onChange={(e) => onChange({ offer_pix: e.target.checked })}
            />
            Aceita Pix
          </label>
          <div className="flex items-center gap-1.5">
            <span>Garantia:</span>
            <input
              type="text"
              value={form.offer_garantia}
              onChange={(e) => onChange({ offer_garantia: e.target.value })}
              className="border border-gray-300 rounded px-2 py-0.5 text-sm w-20"
              placeholder="30 dias"
            />
          </div>
        </div>
      </div>

      {field(
        "Público-alvo *",
        <input
          type="text"
          required
          value={form.target_audience}
          onChange={(e) => onChange({ target_audience: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="marceneiros e DIY"
        />
      )}

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.no_medical_claims}
          onChange={(e) => onChange({ no_medical_claims: e.target.checked })}
        />
        Sem alegações médicas / de saúde
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={onNext}
        disabled={loading}
        className="w-full bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Criando…" : "Próximo: Fotos →"}
      </button>
    </div>
  );
}

// ─── Step 2: Photo upload ─────────────────────────────────────────────────────

function Step2Photos({
  files,
  onAddFiles,
  onRemove,
  onNext,
  onBack,
  uploading,
  error,
}: {
  files: FileState[];
  onAddFiles: (newFiles: File[]) => void;
  onRemove: (key: string) => void;
  onNext: () => void;
  onBack: () => void;
  uploading: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files);
      onAddFiles(dropped);
    },
    [onAddFiles]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const canAddMore = files.length < MAX_FILES;
  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const anyUploading = files.some((f) => f.status === "uploading");

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Adicione de 1 a {MAX_FILES} fotos do produto (JPG, PNG ou WEBP, máx 5 MB cada).
        As imagens serão usadas para criar o plano visual dos criativos.
      </p>

      {/* Drop zone */}
      {canAddMore && !uploading && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-sm text-gray-500">
            Arraste as fotos aqui ou{" "}
            <span className="text-blue-600 underline">clique para selecionar</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {files.length}/{MAX_FILES} fotos adicionadas
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((f) => (
            <div key={f.key} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.previewUrl}
                alt={f.file.name}
                className="w-full h-28 object-cover rounded-lg border border-gray-200"
              />

              {/* Status overlay */}
              {f.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-white text-xs font-medium">{f.progress}%</span>
                  <div className="w-3/4 bg-gray-600 rounded-full h-1 mt-1">
                    <div
                      className="bg-blue-400 h-1 rounded-full transition-all"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                </div>
              )}
              {f.status === "done" && (
                <div className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              {f.status === "error" && (
                <div className="absolute inset-0 bg-red-900/60 rounded-lg flex items-center justify-center p-1">
                  <span className="text-white text-xs text-center">{f.errorMsg}</span>
                </div>
              )}

              {/* Remove button */}
              {!uploading && f.status !== "uploading" && (
                <button
                  onClick={() => onRemove(f.key)}
                  className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remover"
                >
                  ×
                </button>
              )}

              <p className="text-xs text-gray-500 mt-0.5 truncate">{f.file.name}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={uploading}
          className="text-gray-500 text-sm hover:text-gray-700 disabled:opacity-40"
        >
          ← Voltar
        </button>
        <button
          onClick={onNext}
          disabled={uploading || files.length === 0 || anyUploading}
          className="flex-1 bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading
            ? "Enviando…"
            : anyUploading
            ? "Aguardando uploads…"
            : allDone
            ? "Próximo: Gerar →"
            : "Enviar fotos e continuar →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Generate settings ────────────────────────────────────────────────

function Step3Generate({
  form,
  onChange,
  onGenerate,
  onBack,
  loading,
  error,
  imageCount,
}: {
  form: GenForm;
  onChange: (f: Partial<GenForm>) => void;
  onGenerate: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  imageCount: number;
}) {
  return (
    <div className="space-y-4">
      {imageCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-700">
          {imageCount} foto{imageCount > 1 ? "s" : ""} enviada
          {imageCount > 1 ? "s" : ""} com sucesso — o plano visual será baseado nas suas imagens reais.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plataforma alvo
          </label>
          <select
            value={form.target_platform}
            onChange={(e) => onChange({ target_platform: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {TARGET_PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
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
            onChange={(e) => onChange({ marketplace_context: e.target.value })}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de variações
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={form.output_count}
          onChange={(e) => onChange({ output_count: parseInt(e.target.value, 10) || 5 })}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-24"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="text-gray-500 text-sm hover:text-gray-700 disabled:opacity-40"
        >
          ← Voltar
        </button>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Gerando variações…" : "Gerar variações"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [committedImageUrls, setCommittedImageUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<FileState[]>([]);

  const [productForm, setProductForm] = useState<ProductForm>({
    product_name: "",
    product_category: "",
    product_description: "",
    product_bullets_raw: "",
    price: "",
    offer_frete: false,
    offer_garantia: "",
    offer_pix: false,
    target_audience: "",
    no_medical_claims: true,
  });

  const [genForm, setGenForm] = useState<GenForm>({
    target_platform: "tiktok",
    marketplace_context: "none",
    output_count: 5,
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 1 → Step 2: create asset ──────────────────────────────────────────
  async function handleStep1Next() {
    const { product_name, product_category, product_description, product_bullets_raw, price, target_audience } =
      productForm;

    if (!product_name || !product_category || !product_description || !product_bullets_raw || !price || !target_audience) {
      setError("Preencha todos os campos obrigatórios (*).");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/product-assets/create", { method: "POST" });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Erro ao criar asset");
      return;
    }

    setAssetId(body.asset_id);
    setStep(2);
  }

  // ── Add / remove files ──────────────────────────────────────────────────────
  const handleAddFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const accepted: FileState[] = [];

      for (const file of incoming) {
        if (files.length + accepted.length >= MAX_FILES) {
          setError(`Máximo de ${MAX_FILES} fotos.`);
          break;
        }
        if (!ACCEPTED_TYPES.includes(file.type as AcceptedType)) {
          setError("Apenas JPG, PNG e WEBP são aceitos.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`"${file.name}" excede 5 MB.`);
          continue;
        }
        accepted.push({
          key: `${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
          status: "idle",
          progress: 0,
        });
      }

      if (accepted.length > 0) {
        setFiles((prev) => [...prev, ...accepted]);
      }
    },
    [files.length]
  );

  const handleRemoveFile = useCallback((key: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.key === key);
      if (f) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((x) => x.key !== key);
    });
  }, []);

  // ── Step 2 → Step 3: upload + commit ───────────────────────────────────────
  async function handleStep2Next() {
    if (files.length === 0) {
      setError("Adicione pelo menos 1 foto.");
      return;
    }
    if (!assetId) {
      setError("Asset não inicializado. Volte ao passo 1.");
      return;
    }

    setUploading(true);
    setError(null);

    const successPaths: string[] = [];

    for (const fileState of files) {
      if (fileState.status === "done" && fileState.path) {
        successPaths.push(fileState.path);
        continue;
      }

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.key === fileState.key ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      try {
        // 1) Get signed upload URL
        const urlRes = await fetch("/api/product-assets/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asset_id: assetId,
            filename: fileState.file.name,
            content_type: fileState.file.type,
          }),
        });

        if (!urlRes.ok) {
          const e = await urlRes.json().catch(() => ({}));
          throw new Error(e.error ?? "Erro ao obter URL de upload");
        }

        const { signed_url, path, content_type } = await urlRes.json();

        // 2) Upload via XHR (with progress)
        await xhrPut(signed_url, fileState.file, content_type, (pct) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.key === fileState.key ? { ...f, progress: pct } : f
            )
          );
        });

        // Mark done
        setFiles((prev) =>
          prev.map((f) =>
            f.key === fileState.key ? { ...f, status: "done", progress: 100, path } : f
          )
        );
        successPaths.push(path);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha no upload";
        setFiles((prev) =>
          prev.map((f) =>
            f.key === fileState.key ? { ...f, status: "error", errorMsg: msg } : f
          )
        );
      }
    }

    if (successPaths.length === 0) {
      setUploading(false);
      setError("Nenhuma foto foi enviada com sucesso.");
      return;
    }

    // 3) Commit asset
    const commitRes = await fetch("/api/product-assets/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_id: assetId, paths: successPaths }),
    });

    const commitBody = await commitRes.json();
    setUploading(false);

    if (!commitRes.ok) {
      setError(commitBody.error ?? "Erro ao confirmar upload");
      return;
    }

    setCommittedImageUrls(commitBody.image_urls ?? []);
    setStep(3);
  }

  // ── Step 3: Generate ────────────────────────────────────────────────────────
  async function handleGenerate() {
    setLoading(true);
    setError(null);

    const bullets = productForm.product_bullets_raw
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const offerTerms: Record<string, unknown> = {};
    if (productForm.offer_frete) offerTerms["frete"] = "grátis";
    if (productForm.offer_garantia) offerTerms["garantia"] = productForm.offer_garantia;
    if (productForm.offer_pix) offerTerms["pix"] = true;

    const payload = {
      target_platform: genForm.target_platform,
      marketplace_context: genForm.marketplace_context,
      product_category: productForm.product_category,
      product_name: productForm.product_name,
      product_description: productForm.product_description,
      product_bullets: bullets,
      price: productForm.price,
      offer_terms: offerTerms,
      target_audience: productForm.target_audience,
      constraints: { no_medical_claims: productForm.no_medical_claims },
      output_count: genForm.output_count,
      ...(assetId ? { product_asset_id: assetId } : {}),
      product_image_urls: committedImageUrls,
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold mb-2">Gerar Variações</h1>

      <StepBar current={step} />

      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Passo 1 — Informações do produto
          </h2>
          <Step1Product
            form={productForm}
            onChange={(f) => setProductForm((prev) => ({ ...prev, ...f }))}
            onNext={handleStep1Next}
            loading={loading}
            error={error}
          />
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Passo 2 — Fotos do produto
          </h2>
          <Step2Photos
            files={files}
            onAddFiles={handleAddFiles}
            onRemove={handleRemoveFile}
            onNext={handleStep2Next}
            onBack={() => { setError(null); setStep(1); }}
            uploading={uploading}
            error={error}
          />
        </div>
      )}

      {step === 3 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Passo 3 — Configurar e gerar
          </h2>
          <Step3Generate
            form={genForm}
            onChange={(f) => setGenForm((prev) => ({ ...prev, ...f }))}
            onGenerate={handleGenerate}
            onBack={() => { setError(null); setStep(2); }}
            loading={loading}
            error={error}
            imageCount={committedImageUrls.length}
          />
        </div>
      )}
    </div>
  );
}
