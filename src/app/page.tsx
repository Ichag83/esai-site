"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ── Scroll reveal ─────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-up");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Cinematic scroll: hero zoom-in + section zoom-out/blur + cloud parallax */
function useCinematicScroll() {
  useEffect(() => {
    let rafId: number;

    const update = () => {
      const vh = window.innerHeight;

      /* 1 ── Hero BG: zooms in and fades as you scroll away */
      const heroBg = document.querySelector<HTMLElement>(".ic-hero-zoom");
      if (heroBg) {
        const p = Math.min(1, window.scrollY / vh);
        heroBg.style.transform = `scale(${1 + p * 0.2})`;
        heroBg.style.opacity   = String(1 - p * 0.55);
      }

      /* 2 ── Zoom sections: enter with zoom-out, exit with zoom-in + blur */
      document.querySelectorAll<HTMLElement>(".ic-zoom-section").forEach((section) => {
        const bg      = section.querySelector<HTMLElement>(".ic-zoom-bg");
        const content = section.querySelector<HTMLElement>(".ic-zoom-content");
        const rect    = section.getBoundingClientRect();

        // Enter progress (0 = bottom of screen, 1 = fully in view)
        const enterP = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));

        if (rect.top >= 0) {
          // Approaching: bg starts zoomed-in, normalises as it enters
          if (bg) {
            bg.style.transform = `scale(${Math.max(1, 1.18 - enterP * 0.18)})`;
            bg.style.filter    = "";
          }
          if (content) { content.style.transform = ""; content.style.opacity = ""; }
        } else {
          // Exiting upward: bg keeps zooming + blurs, content lifts + fades
          const exitP = Math.min(1, Math.abs(rect.top) / (vh * 0.75));
          if (bg) {
            bg.style.transform = `scale(${1 + exitP * 0.22})`;
            bg.style.filter    = `blur(${(exitP * 10).toFixed(1)}px)`;
          }
          if (content) {
            content.style.transform = `translateY(${-exitP * 55}px)`;
            content.style.opacity   = String(Math.max(0, 1 - exitP * 1.5));
          }
        }
      });

      /* 3 ── Cloud break: parallax on the inner blob layer */
      document.querySelectorAll<HTMLElement>(".cloud-break-inner").forEach((inner) => {
        const wrap = inner.closest<HTMLElement>(".cloud-break");
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const p    = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
        inner.style.transform = `scale(${1.1 + p * 0.12}) translateY(${(0.5 - p) * 50}px)`;
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);
}

/* ── Main ──────────────────────────────────────── */
export default function LandingPage() {
  useReveal();
  useCinematicScroll();

  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const NAV_LINKS = [
    ["#manifesto", "Manifesto"],
    ["#solucoes",  "Soluções"],
    ["#processo",  "Processo"],
    ["#precos",    "Preços"],
  ];

  const TABS = [
    {
      label: "Análise",
      num: "01",
      title: "Análise de Criativos",
      body: "Nossa IA desvenda o que funciona nos seus melhores anúncios — hooks, CTAs, timing emocional e elementos visuais que realmente convertem.",
      tags: ["Pattern Extraction", "IA Scoring", "Benchmarks"],
      visual: <VisAnalise />,
    },
    {
      label: "Geração",
      num: "02",
      title: "Geração de Vídeo UGC",
      body: "Crie dezenas de vídeos de alta conversão com atores virtuais, roteiros otimizados e variações A/B prontas para veicular — em minutos.",
      tags: ["UGC Sintético", "Multi-variante", "Pronto para ads"],
      visual: <VisGeracao />,
    },
    {
      label: "Blueprints",
      num: "03",
      title: "Blueprints Inteligentes",
      body: "Transforme insights em receitas criativas reutilizáveis. Escale o que funciona com consistência, velocidade e previsibilidade.",
      tags: ["Templates dinâmicos", "Escala criativa", "Iteração rápida"],
      visual: <VisBlueprint />,
    },
  ];

  return (
    <>
      {/* NAV */}
      <nav className={`ic-nav ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="ic-logo">
          <HexIcon size={22} />
          Ice &amp; Code
        </Link>
        <ul className="ic-nav-links">
          {NAV_LINKS.map(([h, l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="ic-nav-right">
          <Link href="/login" className="btn-ghost">Entrar</Link>
          <Link href="/login" className="btn-primary">Começar →</Link>
        </div>
        <button className="ic-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {menuOpen && (
        <div className="ic-mobile-menu">
          {NAV_LINKS.map(([h, l]) => (
            <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>
          ))}
          <Link href="/login" className="btn-primary" onClick={() => setMenuOpen(false)}>
            Começar →
          </Link>
        </div>
      )}

      {/* HERO */}
      <section className="ic-hero" id="top">
        <div className="ic-hero-zoom" />

        <div className="ic-hero-content">
          <div className="ic-badge reveal d1">
            <span className="ic-badge-dot" />
            Powered by IA · Feito para criativos
          </div>

          <h1 className="ic-hero-title reveal d2">
            Criatividade com<br />
            <span className="hl">Inteligência</span> que escala.
          </h1>

          <p className="ic-hero-sub reveal d3">
            Ice &amp; Code transforma briefings em criativos de alta performance.
            Analise, gere e otimize peças de vídeo e imagem com IA generativa.
          </p>

          <div className="ic-hero-actions reveal d4">
            <Link href="/login" className="btn-primary btn-lg">
              Começar grátis <Arrow />
            </Link>
            <a href="#processo" className="btn-ghost btn-lg">
              Ver como funciona <Play />
            </a>
          </div>

          <p className="ic-hero-note reveal d4">Sem cartão de crédito. Plano gratuito disponível.</p>
        </div>

        <div className="ic-scroll-hint">
          <div className="ic-scroll-bar" />
          <span>scroll</span>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="ic-marquee">
        <div className="ic-marquee-track">
          {Array(4).fill(null).map((_, i) =>
            ["Análise de Criativos", "Geração de Vídeo", "UGC Sintético", "Blueprints IA", "Performance de Ads", "Escala Criativa"].map((t) => (
              <span className="ic-marquee-item" key={`${i}-${t}`}>
                <span className="ic-marquee-text">{t}</span>
                <span className="ic-marquee-sep" />
              </span>
            ))
          )}
        </div>
      </div>

      {/* ZOOM SECTION 1 — Manifesto */}
      <section className="ic-zoom-section" id="manifesto" style={{ minHeight: "80vh" }}>
        <div
          className="ic-zoom-bg"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 65% 45%, rgba(37,99,235,0.2) 0%, rgba(99,102,241,0.08) 50%, transparent 75%), linear-gradient(135deg, #060f1f 0%, #030b18 100%)",
          }}
        />
        <div className="ic-zoom-overlay" />
        <div className="ic-zoom-content">
          <div className="ic-zoom-label reveal">01 — Manifesto</div>
          <h2 className="ic-zoom-title reveal">
            Criatividade não deveria ser<br />
            um gargalo.<br />
            <span className="hl">Deveria ser vantagem.</span>
          </h2>
          <p className="ic-zoom-body reveal">
            Equipes criativas perdem horas em trabalho repetitivo: adaptar formatos,
            reescrever roteiros, testar variações manualmente. Ice &amp; Code existe
            para mudar isso. Combinamos análise profunda com geração generativa para
            que sua equipe foque no que realmente importa.
          </p>
          <Link href="/login" className="btn-primary reveal">
            Conhecer a plataforma <Arrow />
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div className="ic-stats" id="solucoes">
        {[
          { v: "10×",  l: "mais criativos produzidos por sprint" },
          { v: "60%",  l: "redução no custo por criativo" },
          { v: "3.2×", l: "melhora média em CTR" },
          { v: "48h",  l: "do briefing ao vídeo finalizado" },
        ].map((s, i) => (
          <div className={`ic-stat reveal d${i + 1}`} key={s.l}>
            <div className="ic-stat-val">{s.v}</div>
            <div className="ic-stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      {/* CLOUD BREAK */}
      <CloudBreak />

      {/* ZOOM SECTION 2 — Solução */}
      <section className="ic-zoom-section" style={{ minHeight: "75vh" }}>
        <div
          className="ic-zoom-bg"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 35% 55%, rgba(139,92,246,0.18) 0%, rgba(37,99,235,0.1) 45%, transparent 70%), linear-gradient(135deg, #07101f 0%, #030b18 100%)",
          }}
        />
        <div className="ic-zoom-overlay" style={{ background: "linear-gradient(to right, rgba(3,11,24,0.9) 40%, rgba(3,11,24,0.35) 100%)" }} />
        <div className="ic-zoom-content">
          <div className="ic-zoom-label reveal">02 — Por que Ice &amp; Code</div>
          <h2 className="ic-zoom-title reveal">
            A IA que entende<br />
            <span className="hl">performance criativa.</span>
          </h2>
          <p className="ic-zoom-body reveal">
            Diferente de ferramentas genéricas, nossa IA foi treinada para entender
            o que faz um criativo de mídia paga converter. Analisamos estrutura
            narrativa, timing emocional, elementos visuais e padrões de sucesso
            do seu mercado.
          </p>
          <div className="ic-zoom-tags reveal">
            {["IA Generativa", "Video UGC", "Análise Semântica", "Performance"].map((t) => (
              <span className="ic-tag" key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* SLIDE TABS — Processo / Produto */}
      <section className="ic-slides-section" id="processo">
        <div className="ic-slides-header">
          <div className="ic-section-badge reveal">03 — Produto</div>
          <h2 className="ic-section-title reveal">
            Tudo que você precisa,<br />
            <span className="hl">num único lugar.</span>
          </h2>
          <p className="ic-section-sub reveal">
            Do upload do criativo existente à geração do próximo hit — end-to-end.
          </p>
        </div>

        <div className="ic-slide-tabs reveal">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              className={`ic-tab ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {TABS.map((t, i) => (
          <div className={`ic-slide-panel ${activeTab === i ? "active" : ""}`} key={t.num}>
            <div className="ic-slide-text">
              <div className="ic-slide-num">{t.num}</div>
              <h3 className="ic-slide-title">{t.title}</h3>
              <p className="ic-slide-body">{t.body}</p>
              <div className="ic-zoom-tags">
                {t.tags.map((tag) => (
                  <span className="ic-tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <div className="ic-slide-visual">
              <div className="ic-vis-glow" />
              <div className="ic-slide-visual-inner">{t.visual}</div>
            </div>
          </div>
        ))}
      </section>

      {/* SERVICES */}
      <section className="ic-services">
        <div className="ic-services-inner">
          <div className="ic-services-head">
            <div>
              <div className="ic-section-badge reveal">04 — Serviços</div>
              <h2 className="ic-section-title reveal" style={{ textAlign: "left" }}>
                O que fazemos<br />
                <span className="hl">por você</span>
              </h2>
            </div>
            <Link href="/login" className="btn-ghost reveal">Ver todos os recursos →</Link>
          </div>

          {[
            { n: "01", name: "Análise de Criativos",    desc: "Entenda o que funciona nos seus melhores anúncios. A IA extrai padrões, hooks, CTAs e elementos visuais que geram performance." },
            { n: "02", name: "Geração de Vídeo UGC",    desc: "Vídeos UGC de alta conversão com atores virtuais, roteiros otimizados e variações A/B prontas para veicular." },
            { n: "03", name: "Blueprints Inteligentes", desc: "Transforme análises em receitas de criativos reutilizáveis. Escale o que funciona com consistência e velocidade." },
            { n: "04", name: "Otimização Contínua",     desc: "Monitore a performance dos criativos gerados e receba recomendações automáticas para novas iterações." },
          ].map((s, i) => (
            <div className={`ic-service-row reveal d${(i % 4) + 1}`} key={s.n}>
              <div className="ic-svc-num">{s.n}</div>
              <div>
                <div className="ic-svc-name">{s.name}</div>
                <div className="ic-svc-desc">{s.desc}</div>
              </div>
              <div className="ic-svc-arrow"><Arrow size={20} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="ic-pricing" id="precos">
        <div className="ic-pricing-inner">
          <div style={{ textAlign: "center" }}>
            <div className="ic-section-badge reveal">05 — Planos</div>
            <h2 className="ic-section-title reveal">
              Simples e <span className="hl">transparente</span>
            </h2>
            <p className="ic-section-sub reveal">Escale conforme seu time cresce.</p>
          </div>

          <div className="ic-pricing-grid">
            {[
              {
                name: "Starter", price: "Grátis", period: "para sempre",
                desc: "Para explorar a plataforma e entender o potencial da IA criativa.",
                feats: ["5 análises / mês", "2 gerações de vídeo", "1 usuário", "Suporte por email"],
                cta: "Começar grátis", feature: false,
              },
              {
                name: "Pro", price: "R$ 497", period: "por mês",
                desc: "Para equipes criativas em crescimento que precisam de volume e velocidade.",
                feats: ["100 análises / mês", "30 gerações de vídeo", "5 usuários", "Blueprints ilimitados", "Suporte prioritário"],
                cta: "Assinar Pro", feature: true,
              },
              {
                name: "Enterprise", price: "Custom", period: "negociado",
                desc: "Para grandes operações com volume, segurança e SLA dedicado.",
                feats: ["Volume ilimitado", "Usuários ilimitados", "API access", "SLA dedicado", "Onboarding personalizado"],
                cta: "Falar com vendas", feature: false,
              },
            ].map((p) => (
              <div className={`ic-plan reveal ${p.feature ? "ic-plan--feature" : ""}`} key={p.name}>
                {p.feature && <div className="ic-plan-topbar" />}
                <div className="ic-plan-name">{p.name}</div>
                <div className="ic-plan-price">{p.price}</div>
                <div className="ic-plan-period">{p.period}</div>
                <div className="ic-plan-desc">{p.desc}</div>
                <ul className="ic-plan-features">
                  {p.feats.map((f) => (
                    <li key={f}>
                      <CheckIcon className="ic-plan-check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={p.feature ? "btn-primary" : "btn-ghost"} style={{ justifyContent: "center" }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ic-cta">
        <div className="ic-cta-glow" />
        <div className="ic-cta-inner">
          <h2 className="ic-cta-title reveal">
            Pronto para <span className="hl">escalar</span><br />
            sua criatividade?
          </h2>
          <p className="ic-cta-sub reveal">
            Junte-se a centenas de equipes que já usam Ice &amp; Code
            para produzir criativos de performance em escala.
          </p>
          <div className="ic-cta-actions reveal">
            <Link href="/login" className="btn-primary btn-lg">Começar grátis</Link>
            <a href="mailto:contato@iceandcode.com.br" className="btn-ghost btn-lg">Falar com a equipe</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ic-footer">
        <div className="ic-footer-top">
          <div>
            <Link href="/" className="ic-logo">
              <HexIcon size={20} />
              Ice &amp; Code
            </Link>
            <p className="ic-footer-tagline">
              Inteligência criativa para performance de ads em escala.
            </p>
          </div>
          {[
            { title: "Produto",  links: [["#solucoes","Soluções"],["#processo","Como funciona"],["#precos","Preços"]] },
            { title: "Empresa",  links: [["#","Sobre nós"],["#","Blog"],["#","Carreiras"]] },
            { title: "Suporte",  links: [["#","Documentação"],["#","Status"],["mailto:contato@iceandcode.com.br","Contato"]] },
          ].map((col) => (
            <div className="ic-footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(([href, label]) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ic-footer-bottom">
          <span>© 2025 Ice &amp; Code. Todos os direitos reservados.</span>
          <div className="ic-footer-legal">
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ── Cloud Break ────────────────────────────────── */
function CloudBreak() {
  return (
    <div className="cloud-break">
      <div className="cloud-break-inner">
        <div className="cb-l1" />
        <div className="cb-l2" />
        <div className="cb-l3" />
        <div className="cb-l4" />
        <div className="cb-stars" />
        <div className="cb-vignette" />
        <div className="cb-ring" />
        <div className="cb-icon">
          <HexIcon size={48} />
        </div>
      </div>
    </div>
  );
}

/* ── Visual mockups ──────────────────────────────── */
function VisAnalise() {
  return (
    <div className="ic-vis-mockup">
      <div className="ic-vis-topbar"><span /><span /><span /></div>
      <div className="ic-vis-body">
        <div className="ic-vis-label">Creative Analysis</div>
        <div className="ic-vis-bar" style={{ width: "88%" }} />
        <div className="ic-vis-bar" style={{ width: "64%", opacity: 0.6 }} />
        <div className="ic-vis-bar" style={{ width: "76%", opacity: 0.8 }} />
        <div className="ic-vis-chart" style={{ marginTop: 12 }}>
          {[40,65,50,82,58,90,70].map((h,i) => (
            <div className={`ic-vis-col ${i === 5 ? "hi" : ""}`} key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
function VisGeracao() {
  return (
    <div className="ic-vis-mockup">
      <div className="ic-vis-topbar"><span /><span /><span /></div>
      <div className="ic-vis-body">
        <div className="ic-vis-label">Video Generation</div>
        <div className="ic-vis-row">
          <div className="ic-vis-block accent" />
          <div className="ic-vis-block" />
        </div>
        <div className="ic-vis-row">
          <div className="ic-vis-block" />
          <div className="ic-vis-block accent" />
        </div>
        <div className="ic-vis-bar" style={{ width: "100%", marginTop: 8 }} />
      </div>
    </div>
  );
}
function VisBlueprint() {
  return (
    <div className="ic-vis-mockup">
      <div className="ic-vis-topbar"><span /><span /><span /></div>
      <div className="ic-vis-body">
        <div className="ic-vis-label">Blueprint Builder</div>
        {["Hook", "Proposta", "Prova Social", "CTA"].map((l, i) => (
          <div className="ic-vis-row" key={l} style={{ alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 8, color: "var(--blue-lt)", width: 60, flexShrink: 0 }}>{l}</span>
            <div className="ic-vis-block" style={{ height: 20, opacity: 1 - i * 0.1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────── */
function HexIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
      <circle cx="14" cy="14" r="2.5" fill="#3b82f6" />
    </svg>
  );
}

function Arrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Play({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
