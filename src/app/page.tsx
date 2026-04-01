"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-root">
      {/* NAV */}
      <nav className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <IceLogo />
            <span>Ice & Code</span>
          </Link>

          <ul className="nav-links">
            <li><a href="#product">Product</a></li>
            <li><a href="#solutions">Solutions</a></li>
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>

          <div className="nav-actions">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/login" className="btn-primary">Get started</Link>
          </div>

          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {menuOpen && (
          <div className="nav-mobile-menu">
            <a href="#product" onClick={() => setMenuOpen(false)}>Product</a>
            <a href="#solutions" onClick={() => setMenuOpen(false)}>Solutions</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <Link href="/login" className="btn-primary" onClick={() => setMenuOpen(false)}>Get started</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="hero-section" id="top">
        {/* background orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-bg" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Powered by AI · Built for creatives
          </div>

          <h1 className="hero-title">
            Criatividade com
            <span className="gradient-text"> Inteligência</span>
            <br />que escala.
          </h1>

          <p className="hero-subtitle">
            Ice &amp; Code transforma briefings em criativos de alta performance.<br />
            Analise, gere e otimize peças de vídeo e imagem com IA generativa de ponta.
          </p>

          <div className="hero-actions">
            <Link href="/login" className="btn-primary btn-lg">
              Começar grátis
              <ArrowRight />
            </Link>
            <a href="#how-it-works" className="btn-ghost btn-lg">
              Ver demo
              <PlayIcon />
            </a>
          </div>

          <p className="hero-note">Sem cartão de crédito. Plano gratuito disponível.</p>
        </div>

        {/* Product screenshot / dashboard preview */}
        <div className="hero-visual">
          <div className="dashboard-mockup">
            <div className="mockup-topbar">
              <span /><span /><span />
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="sidebar-item active" />
                <div className="sidebar-item" />
                <div className="sidebar-item" />
                <div className="sidebar-item" />
              </div>
              <div className="mockup-main">
                <div className="mockup-card glow-card">
                  <div className="card-label">Creative Analysis</div>
                  <div className="card-bar" style={{ width: "90%" }} />
                  <div className="card-bar" style={{ width: "65%" }} />
                  <div className="card-bar" style={{ width: "78%" }} />
                </div>
                <div className="mockup-row">
                  <div className="mockup-mini-card">
                    <div className="mini-icon blue" />
                    <div className="mini-text" />
                  </div>
                  <div className="mockup-mini-card">
                    <div className="mini-icon purple" />
                    <div className="mini-text" />
                  </div>
                  <div className="mockup-mini-card">
                    <div className="mini-icon teal" />
                    <div className="mini-text" />
                  </div>
                </div>
                <div className="mockup-chart">
                  <div className="chart-bar" style={{ height: "40%" }} />
                  <div className="chart-bar" style={{ height: "65%" }} />
                  <div className="chart-bar" style={{ height: "50%" }} />
                  <div className="chart-bar" style={{ height: "80%" }} />
                  <div className="chart-bar" style={{ height: "60%" }} />
                  <div className="chart-bar active" style={{ height: "90%" }} />
                  <div className="chart-bar" style={{ height: "70%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS BAR */}
      <section className="logos-section">
        <p className="logos-label">Confiado por equipes criativas em todo o Brasil</p>
        <div className="logos-row">
          {["OGILVY", "WPP", "BETSSON", "GLOBO", "NUBANK", "AMBEV", "NATURA"].map((name) => (
            <span key={name} className="logo-item">{name}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="product">
        <div className="section-header">
          <div className="section-badge">Plataforma</div>
          <h2 className="section-title">Tudo que sua equipe criativa precisa</h2>
          <p className="section-subtitle">
            Da análise de criativos à geração de vídeo — um único workspace integrado.
          </p>
        </div>

        <div className="features-grid">
          <FeatureCard
            icon={<AnalyzeIcon />}
            color="blue"
            title="Análise de Criativos"
            description="Entenda o que funciona nos seus melhores anúncios. Nossa IA extrai padrões, hooks, CTAs e elementos visuais que geram performance."
            tags={["Extração de padrões", "Scoring por IA", "Benchmarks"]}
          />
          <FeatureCard
            icon={<GenerateIcon />}
            color="purple"
            title="Geração de Vídeo"
            description="Crie vídeos UGC de alta conversão com atores virtuais, roteiros otimizados e variações A/B prontas para veicular."
            tags={["UGC Sintético", "Multi-variante", "Pronto para ads"]}
          />
          <FeatureCard
            icon={<OptimizeIcon />}
            color="teal"
            title="Blueprints Inteligentes"
            description="Transforme análises em receitas de criativos reutilizáveis. Escale o que funciona com consistência e velocidade."
            tags={["Templates dinâmicos", "Escala criativa", "Iteração rápida"]}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <div className="section-badge">Workflow</div>
          <h2 className="section-title">De briefing a criativo em minutos</h2>
        </div>

        <div className="steps-container">
          <div className="steps-line" />
          {[
            {
              step: "01",
              title: "Faça upload dos seus criativos",
              desc: "Importe vídeos, imagens e anúncios existentes. A IA analisa cada elemento visual, narrativo e emocional.",
              color: "blue",
            },
            {
              step: "02",
              title: "Receba insights e blueprints",
              desc: "Identifique os padrões de sucesso. Gere blueprints reutilizáveis com estrutura de hook, proposta e CTA.",
              color: "purple",
            },
            {
              step: "03",
              title: "Gere novos criativos em escala",
              desc: "Use os blueprints para produzir dezenas de variações com atores virtuais e voiceover em português.",
              color: "teal",
            },
          ].map((item) => (
            <div className="step-card" key={item.step}>
              <div className={`step-number step-${item.color}`}>{item.step}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section" id="solutions">
        <div className="stats-inner">
          <div className="stats-text">
            <div className="section-badge">Resultados</div>
            <h2 className="section-title">Números que falam por si</h2>
            <p className="section-subtitle">
              Equipes que usam Ice &amp; Code produzem mais criativos, com mais qualidade, em menos tempo.
            </p>
            <Link href="/login" className="btn-primary">
              Ver case studies <ArrowRight />
            </Link>
          </div>
          <div className="stats-grid">
            {[
              { value: "10×", label: "mais criativos produzidos", color: "blue" },
              { value: "60%", label: "redução no custo por criativo", color: "purple" },
              { value: "3.2×", label: "melhora em CTR médio", color: "teal" },
              { value: "48h", label: "do briefing ao vídeo finalizado", color: "blue" },
            ].map((s) => (
              <div className={`stat-card stat-${s.color}`} key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <div className="section-badge">Planos</div>
          <h2 className="section-title">Simples e transparente</h2>
          <p className="section-subtitle">Escale conforme seu time cresce.</p>
        </div>

        <div className="pricing-grid">
          <PricingCard
            plan="Starter"
            price="Grátis"
            period=""
            desc="Para explorar a plataforma"
            features={["5 análises / mês", "2 gerações de vídeo", "1 usuário", "Suporte por email"]}
            cta="Começar grátis"
            highlight={false}
          />
          <PricingCard
            plan="Pro"
            price="R$ 497"
            period="/mês"
            desc="Para equipes criativas em crescimento"
            features={["100 análises / mês", "30 gerações de vídeo", "5 usuários", "Blueprints ilimitados", "Suporte prioritário"]}
            cta="Assinar Pro"
            highlight={true}
          />
          <PricingCard
            plan="Enterprise"
            price="Custom"
            period=""
            desc="Para grandes operações criativas"
            features={["Volume ilimitado", "Usuários ilimitados", "API access", "SLA dedicado", "Onboarding personalizado"]}
            cta="Falar com vendas"
            highlight={false}
          />
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-section">
        <div className="cta-orb" />
        <div className="cta-content">
          <h2 className="cta-title">Pronto para escalar sua criatividade?</h2>
          <p className="cta-subtitle">
            Junte-se a centenas de equipes que já usam IA para produzir criativos de performance.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="btn-primary btn-lg">
              Começar agora <ArrowRight />
            </Link>
            <a href="mailto:contato@iceandcode.com.br" className="btn-ghost btn-lg">
              Falar com a equipe
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link href="/" className="nav-logo">
              <IceLogo />
              <span>Ice & Code</span>
            </Link>
            <p>Inteligência criativa para performance de ads.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Produto</h4>
              <a href="#product">Funcionalidades</a>
              <a href="#how-it-works">Como funciona</a>
              <a href="#pricing">Preços</a>
            </div>
            <div className="footer-col">
              <h4>Empresa</h4>
              <a href="#">Sobre nós</a>
              <a href="#">Blog</a>
              <a href="#">Carreiras</a>
            </div>
            <div className="footer-col">
              <h4>Suporte</h4>
              <a href="#">Documentação</a>
              <a href="#">Status</a>
              <a href="mailto:contato@iceandcode.com.br">Contato</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2025 Ice & Code. Todos os direitos reservados.</span>
          <div className="footer-legal">
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Subcomponents ─────────────────────────────── */

function FeatureCard({
  icon, color, title, description, tags,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  tags: string[];
}) {
  return (
    <div className={`feature-card feature-${color}`}>
      <div className={`feature-icon-wrap icon-${color}`}>{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
      <div className="feature-tags">
        {tags.map((t) => (
          <span key={t} className={`tag tag-${color}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function PricingCard({
  plan, price, period, desc, features, cta, highlight,
}: {
  plan: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlight: boolean;
}) {
  return (
    <div className={`pricing-card ${highlight ? "pricing-card--highlight" : ""}`}>
      {highlight && <div className="pricing-badge">Mais popular</div>}
      <div className="pricing-plan">{plan}</div>
      <div className="pricing-price">
        {price}<span className="pricing-period">{period}</span>
      </div>
      <p className="pricing-desc">{desc}</p>
      <ul className="pricing-features">
        {features.map((f) => (
          <li key={f}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/login" className={highlight ? "btn-primary pricing-cta" : "btn-outline pricing-cta"}>
        {cta}
      </Link>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────── */

function IceLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <polygon points="14,6 22,10 22,18 14,22 6,18 6,10" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
      <circle cx="14" cy="14" r="3" fill="#3b82f6" />
      <line x1="14" y1="2" x2="14" y2="6" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="14" y1="22" x2="14" y2="26" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="2" y1="8" x2="6" y2="10" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="22" y1="18" x2="26" y2="20" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="26" y1="8" x2="22" y2="10" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="2" y1="20" x2="6" y2="18" stroke="#60a5fa" strokeWidth="1.5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="#1e40af" />
      <path d="M4.5 7l2 2 3.5-3.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptimizeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
