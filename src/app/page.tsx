"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── Scroll reveal hook ─────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-line");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Custom cursor ──────────────────────────────── */
function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos  = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top  = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", move);

    let raf: number;
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.current.x}px`;
        ringRef.current.style.top  = `${ring.current.y}px`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function LandingPage() {
  useReveal();
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <Cursor />

      {/* NAV */}
      <nav className={`mf-nav ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="mf-nav-logo">
          <HexLogo size={22} />
          Ice &amp; Code
        </Link>

        <ul className="mf-nav-links">
          {[["#manifesto","Manifesto"],["#servicos","Serviços"],["#processo","Processo"],["#precos","Preços"]].map(([h,l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>

        <div className="mf-nav-cta">
          <Link href="/login" className="btn">Entrar</Link>
          <Link href="/login" className="btn-fill">Começar →</Link>
        </div>

        <button className="mf-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {menuOpen && (
        <div className="mf-mobile-menu">
          {[["#manifesto","Manifesto"],["#servicos","Serviços"],["#processo","Processo"],["#precos","Preços"]].map(([h,l]) => (
            <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>
          ))}
          <Link href="/login" className="btn-fill" onClick={() => setMenuOpen(false)}>Começar →</Link>
        </div>
      )}

      {/* HERO */}
      <section className="mf-hero" id="top">
        <div className="mf-hero-bg" />

        <div className="mf-hero-content">
          <div className="mf-hero-eyebrow reveal">
            <div className="mf-hero-eyebrow-line" />
            <span className="label-blue">Plataforma de Inteligência Criativa</span>
          </div>

          <h1 className="mf-hero-title">
            <div className="reveal-line"><span>Criatividade</span></div>
            <div className="reveal-line" style={{ transitionDelay: "80ms" }}><span>que <em>escala.</em></span></div>
          </h1>

          <div className="mf-hero-bottom">
            <p className="mf-hero-sub reveal" style={{ transitionDelay: "200ms" }}>
              Ice &amp; Code transforma briefings em criativos de alta performance.
              Analise, gere e otimize peças de vídeo e imagem com IA generativa.
            </p>
            <div className="mf-hero-actions reveal" style={{ transitionDelay: "280ms" }}>
              <Link href="/login" className="btn-fill">Começar grátis</Link>
              <a href="#processo" className="btn-stroke">Ver como funciona</a>
            </div>
          </div>
        </div>

        <div className="mf-scroll-hint">
          <div className="mf-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mf-marquee-section">
        <div className="mf-marquee-track">
          {Array(4).fill(null).map((_, i) => (
            <div className="mf-marquee-item" key={i}>
              {["Análise de Criativos","Geração de Vídeo","UGC Sintético","Blueprints IA","Performance de Ads","Escala Criativa"].map((t) => (
                <span key={t} className="mf-marquee-item">
                  <span className="mf-marquee-text">{t}</span>
                  <span className="mf-marquee-dot" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MANIFESTO */}
      <section className="mf-section" id="manifesto">
        <div className="mf-section-inner">
          <div className="mf-about">
            <div className="mf-about-left reveal">
              <div className="label" style={{ marginBottom: 20 }}>01 — Manifesto</div>
              <div className="mf-about-number">01</div>
            </div>
            <div className="mf-about-right stagger">
              <h2 className="mf-about-title reveal">
                Criatividade não deveria ser<br />
                um gargalo.<br />
                <em>Deveria ser vantagem.</em>
              </h2>
              <p className="mf-about-body reveal">
                Equipes criativas perdem horas em trabalho repetitivo: adaptar formatos,
                reescrever roteiros, A/B testar variações manualmente. Ice &amp; Code existe para
                mudar isso. Combinamos análise profunda de criativos existentes com geração
                generativa para que sua equipe foque no que realmente importa — a estratégia
                e a ideia original.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mf-section" style={{ padding: 0 }}>
        <div className="mf-stats-grid">
          {[
            { value: "10", suffix: "×", label: "mais criativos produzidos por sprint" },
            { value: "60", suffix: "%", label: "redução no custo por criativo" },
            { value: "3.2", suffix: "×", label: "melhora média em CTR" },
            { value: "48", suffix: "h", label: "do briefing ao vídeo finalizado" },
          ].map((s, i) => (
            <div className="mf-stat-cell reveal" key={s.label} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="mf-stat-value">{s.value}<span>{s.suffix}</span></div>
              <div className="mf-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="mf-section" id="servicos">
        <div className="mf-section-inner">
          <div className="mf-services-header">
            <div>
              <div className="label reveal" style={{ marginBottom: 16 }}>02 — Serviços</div>
              <h2 className="mf-services-title reveal">
                O que fazemos<br />
                <em>por você</em>
              </h2>
            </div>
            <Link href="/login" className="btn reveal">Ver todos os recursos →</Link>
          </div>

          {[
            {
              num: "01",
              name: "Análise de Criativos",
              desc: "Entenda o que funciona nos seus melhores anúncios. Nossa IA extrai padrões, hooks, CTAs e elementos visuais que geram performance.",
            },
            {
              num: "02",
              name: "Geração de Vídeo UGC",
              desc: "Crie vídeos UGC de alta conversão com atores virtuais, roteiros otimizados e variações A/B prontas para veicular.",
            },
            {
              num: "03",
              name: "Blueprints Inteligentes",
              desc: "Transforme análises em receitas de criativos reutilizáveis. Escale o que funciona com consistência e velocidade.",
            },
            {
              num: "04",
              name: "Otimização Contínua",
              desc: "Monitore a performance dos criativos gerados e receba recomendações automáticas para novas iterações.",
            },
          ].map((s, i) => (
            <div className="mf-service-row reveal" key={s.num} style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="mf-service-num">{s.num}</div>
              <div className="mf-service-body">
                <div className="mf-service-name">{s.name}</div>
                <div className="mf-service-desc">{s.desc}</div>
              </div>
              <div className="mf-service-row-arrow">
                <ArrowRight size={20} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="mf-section" id="processo">
        <div className="mf-section-inner">
          <div className="label reveal" style={{ marginBottom: 16 }}>03 — Processo</div>
          <h2 className="mf-about-title reveal" style={{ marginBottom: 56 }}>
            De briefing a criativo<br />
            <em>em minutos</em>
          </h2>

          <div className="mf-process-grid">
            {[
              {
                idx: "01",
                name: "Upload & Análise",
                text: "Importe vídeos, imagens e anúncios existentes. A IA analisa cada elemento visual, narrativo e emocional em segundos.",
              },
              {
                idx: "02",
                name: "Insights & Blueprints",
                text: "Identifique os padrões de sucesso. Gere blueprints reutilizáveis com estrutura de hook, proposta e CTA validados.",
              },
              {
                idx: "03",
                name: "Geração em Escala",
                text: "Use os blueprints para produzir dezenas de variações com atores virtuais e voiceover em português — prontas para veicular.",
              },
            ].map((p, i) => (
              <div className="mf-process-card reveal" key={p.idx} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="mf-process-idx">{p.idx}</div>
                <div className="label" style={{ marginBottom: 12 }}>{p.name}</div>
                <div className="mf-process-name">{p.name}</div>
                <div className="mf-process-text">{p.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mf-section" id="precos">
        <div className="mf-section-inner">
          <div className="label reveal" style={{ marginBottom: 16 }}>04 — Planos</div>
          <h2 className="mf-about-title reveal" style={{ marginBottom: 56 }}>
            Simples e<br />
            <em>transparente</em>
          </h2>

          <div className="mf-pricing-grid">
            <PricingCard
              plan="Starter"
              price="Grátis"
              period="para sempre"
              desc="Para explorar a plataforma e entender o potencial da IA criativa."
              features={["5 análises / mês","2 gerações de vídeo","1 usuário","Suporte por email"]}
              cta="Começar grátis"
              featured={false}
            />
            <PricingCard
              plan="Pro"
              price="R$ 497"
              period="por mês"
              desc="Para equipes criativas em crescimento que precisam de volume e velocidade."
              features={["100 análises / mês","30 gerações de vídeo","5 usuários","Blueprints ilimitados","Suporte prioritário"]}
              cta="Assinar Pro"
              featured={true}
            />
            <PricingCard
              plan="Enterprise"
              price="Custom"
              period="negociado"
              desc="Para grandes operações criativas com volume, segurança e SLA dedicado."
              features={["Volume ilimitado","Usuários ilimitados","API access","SLA dedicado","Onboarding personalizado"]}
              cta="Falar com vendas"
              featured={false}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mf-section mf-cta">
        <div className="mf-cta-bg" />
        <div className="mf-cta-inner">
          <h2 className="mf-cta-title reveal">
            Pronto para<br />
            <em>escalar?</em>
          </h2>
          <p className="mf-cta-sub reveal">
            Junte-se a centenas de equipes que já usam Ice &amp; Code para produzir
            criativos de performance em escala.
          </p>
          <div className="mf-cta-actions reveal">
            <Link href="/login" className="btn-fill">Começar grátis</Link>
            <a href="mailto:contato@iceandcode.com.br" className="btn-stroke">Falar com a equipe</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mf-footer">
        <div className="mf-footer-top">
          <div className="mf-footer-brand">
            <div className="mf-footer-logo">
              <HexLogo size={20} />
              Ice &amp; Code
            </div>
            <p className="mf-footer-tagline">
              Inteligência criativa para performance de ads em escala.
            </p>
          </div>

          <div className="mf-footer-col">
            <h4>Produto</h4>
            <ul>
              <li><a href="#servicos">Serviços</a></li>
              <li><a href="#processo">Como funciona</a></li>
              <li><a href="#precos">Preços</a></li>
            </ul>
          </div>

          <div className="mf-footer-col">
            <h4>Empresa</h4>
            <ul>
              <li><a href="#">Sobre nós</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Carreiras</a></li>
            </ul>
          </div>

          <div className="mf-footer-col">
            <h4>Suporte</h4>
            <ul>
              <li><a href="#">Documentação</a></li>
              <li><a href="#">Status</a></li>
              <li><a href="mailto:contato@iceandcode.com.br">Contato</a></li>
            </ul>
          </div>
        </div>

        <div className="mf-footer-bottom">
          <span>© 2025 Ice &amp; Code. Todos os direitos reservados.</span>
          <div className="mf-footer-legal">
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ── Sub-components ─────────────────────────────── */
function PricingCard({
  plan, price, period, desc, features, cta, featured,
}: {
  plan: string; price: string; period: string; desc: string;
  features: string[]; cta: string; featured: boolean;
}) {
  return (
    <div className={`mf-pricing-card reveal ${featured ? "mf-pricing-card--featured" : ""}`}>
      {featured && <div className="mf-pricing-featured-bar" />}
      <div className="mf-pricing-plan">{plan}</div>
      <div className="mf-pricing-price">{price}</div>
      <div className="mf-pricing-period">{period}</div>
      <div className="mf-pricing-desc">{desc}</div>
      <ul className="mf-pricing-features">
        {features.map((f) => (
          <li key={f}>
            <svg className="mf-pricing-check" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link href="/login" className={featured ? "btn-fill" : "btn-stroke"} style={{ justifyContent: "center" }}>
        {cta}
      </Link>
    </div>
  );
}

/* ── Icons ──────────────────────────────────────── */
function HexLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,8 26,20 14,26 2,20 2,8"
        fill="none" stroke="#29648e" strokeWidth="1.5" />
      <polygon points="14,7 21,11 21,17 14,21 7,17 7,11"
        fill="none" stroke="#4a90b8" strokeWidth="1" opacity="0.5" />
      <circle cx="14" cy="14" r="2.5" fill="#4a90b8" />
    </svg>
  );
}

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
