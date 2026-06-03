"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

/* ── Scroll reveal ─────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const run = () => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) el.classList.add("in");
      });
    };
    run();
    window.addEventListener("scroll", run, { passive: true });
    return () => window.removeEventListener("scroll", run);
  }, []);
}

/* ── Cinematic scroll ──────────────────────────── */
function useCinematicScroll() {
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const vh = window.innerHeight;

      const heroBg = document.querySelector<HTMLElement>(".ic-hero-zoom");
      if (heroBg) {
        const p = Math.min(1, window.scrollY / vh);
        heroBg.style.transform = `scale(${1 + p * 0.18})`;
        heroBg.style.opacity   = String(1 - p * 0.5);
      }

      document.querySelectorAll<HTMLElement>(".ic-zoom-section").forEach((sec) => {
        const bg  = sec.querySelector<HTMLElement>(".ic-zoom-bg");
        const cnt = sec.querySelector<HTMLElement>(".ic-zoom-content");
        const r   = sec.getBoundingClientRect();
        const enterP = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
        if (r.top >= 0) {
          if (bg)  { bg.style.transform = `scale(${Math.max(1, 1.15 - enterP * 0.15)})`; bg.style.filter = ""; }
          if (cnt) { cnt.style.transform = ""; cnt.style.opacity = ""; }
        } else {
          const exitP = Math.min(1, Math.abs(r.top) / (vh * 0.8));
          if (bg)  { bg.style.transform = `scale(${1 + exitP * 0.2})`; bg.style.filter = `blur(${(exitP * 10).toFixed(1)}px)`; }
          if (cnt) { cnt.style.transform = `translateY(${-exitP * 50}px)`; cnt.style.opacity = String(Math.max(0, 1 - exitP * 1.4)); }
        }
      });

      document.querySelectorAll<HTMLElement>(".cloud-break-inner").forEach((inner) => {
        const wrap = inner.closest<HTMLElement>(".cloud-break");
        if (!wrap) return;
        const r = wrap.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
        inner.style.transform = `scale(${1.08 + p * 0.1}) translateY(${(0.5 - p) * 40}px)`;
      });
    };

    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
}

/* ── Page ──────────────────────────────────────── */
export default function LandingPage() {
  useReveal();
  useCinematicScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const NAV = [["#manifesto","Manifesto"],["#solucoes","Soluções"],["#processo","Como funciona"],["#contato","Contato"]];

  const TABS = [
    {
      label:"Agentes IA",
      num:"01",
      title:"Agentes Autônomos de IA",
      body:"Construímos agentes inteligentes que entendem contexto, tomam decisões e executam tarefas complexas — 24 horas por dia, 7 dias por semana, sem supervisão manual.",
      tags:["Multi-step reasoning","Tool use","API orchestration"],
      visual:<VisAgente/>,
    },
    {
      label:"Workflows",
      num:"02",
      title:"Automação de Workflows",
      body:"Integramos suas ferramentas (CRM, ERP, Slack, planilhas, APIs) em fluxos inteligentes com IA — eliminando trabalho repetitivo e erros humanos.",
      tags:["n8n & Make","Zapier IA","API-first"],
      visual:<VisWorkflow/>,
    },
    {
      label:"LLM & RAG",
      num:"03",
      title:"Sistemas com LLM & RAG",
      body:"Desenvolvemos pipelines com GPT-4, Claude e modelos open-source para extração, geração, análise e recuperação de conhecimento sobre os dados do seu negócio.",
      tags:["GPT-4 / Claude","Vector DB","Fine-tuning"],
      visual:<VisLLM/>,
    },
  ];

  return (
    <>
      {/* NAV */}
      <nav className={`ic-nav ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="ic-logo"><HexIcon size={22}/>Ice &amp; Code</Link>
        <ul className="ic-nav-links">
          {NAV.map(([h,l]) => <li key={h}><a href={h}>{l}</a></li>)}
        </ul>
        <div className="ic-nav-right">
          <Link href="/login" className="btn-ghost">Entrar</Link>
          <Link href="/login" className="btn-primary">Falar com a equipe →</Link>
        </div>
        <button className="ic-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </nav>

      {menuOpen && (
        <div className="ic-mobile-menu">
          {NAV.map(([h,l]) => <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>)}
          <Link href="/login" className="btn-primary" onClick={() => setMenuOpen(false)}>Falar com a equipe →</Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="ic-hero" id="top">
        <div className="ic-hero-zoom">
          <div className="hero-blob hero-blob-1"/>
          <div className="hero-blob hero-blob-2"/>
          <div className="hero-blob hero-blob-3"/>
        </div>
        <div className="ic-hero-content">
          <div className="ic-badge reveal"><span className="ic-badge-dot"/>Agência de IA Premium · Automação Inteligente</div>
          <h1 className="ic-hero-title reveal">Automatize o futuro<br/>do seu negócio com <span className="hl">IA.</span></h1>
          <p className="ic-hero-sub reveal">Ice &amp; Code constrói sistemas de automação com inteligência artificial — do agente autônomo à integração completa. Menos trabalho manual, mais escala e resultado.</p>
          <div className="ic-hero-actions reveal">
            <Link href="/login" className="btn-primary btn-lg">Falar com a equipe <Arrow/></Link>
            <a href="#processo" className="btn-ghost btn-lg">Ver como funciona <Play/></a>
          </div>
          <p className="ic-hero-note reveal">Projetos sob medida. Entrega em semanas, não meses.</p>
        </div>
        <div className="ic-scroll-hint"><div className="ic-scroll-bar"/><span>scroll</span></div>
      </section>

      {/* MARQUEE */}
      <div className="ic-marquee">
        <div className="ic-marquee-track">
          {Array(4).fill(null).map((_,i) =>
            ["Agentes de IA","Automação de Workflows","Integração com LLMs","N8N & Make","APIs Customizadas","IA para Negócios","Processos Autônomos","RAG & Vector DB"].map(t => (
              <span className="ic-marquee-item" key={`${i}-${t}`}>
                <span className="ic-marquee-text">{t}</span>
                <span className="ic-marquee-sep"/>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── ZOOM SECTION 1 — Manifesto ── */}
      <section className="ic-zoom-section" id="manifesto">
        <div className="ic-zoom-bg" style={{ background: "radial-gradient(ellipse 120% 100% at 70% 50%, #1a3a6e 0%, #0d2348 35%, #060f1f 70%, #030b18 100%)" }}/>
        <div className="ic-zoom-overlay"/>
        <div className="ic-zoom-content">
          <div className="ic-zoom-label reveal">01 — Por que automatizar</div>
          <h2 className="ic-zoom-title reveal">Negócios que não automatizam ficam para trás.<br/><span className="hl">O seu não vai.</span></h2>
          <p className="ic-zoom-body reveal">Cada processo manual que consome horas da sua equipe é uma oportunidade de automação esperando para ser capturada. A Ice &amp; Code constrói sistemas com IA que aprendem, adaptam e executam — 24/7 — liberando seu time para o que realmente importa: crescer.</p>
          <Link href="/login" className="btn-primary reveal">Conversar sobre seu projeto <Arrow/></Link>
        </div>
        <div className="ic-zoom-deco">
          <div className="deco-ring deco-ring-1"/>
          <div className="deco-ring deco-ring-2"/>
          <div className="deco-ring deco-ring-3"/>
          <div className="deco-orb"/>
        </div>
      </section>

      {/* STATS */}
      <div className="ic-stats" id="solucoes">
        {[
          {v:"40+",  l:"projetos entregues"},
          {v:"80%",  l:"redução de trabalho manual"},
          {v:"3×",   l:"escala sem contratar"},
          {v:"14d",  l:"do briefing ao deploy"},
        ].map((s,i) => (
          <div className="ic-stat reveal" key={s.l} style={{ transitionDelay: `${i*80}ms` }}>
            <div className="ic-stat-val">{s.v}</div>
            <div className="ic-stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── CLOUD BREAK ── */}
      <NodeBreak/>

      {/* ── ZOOM SECTION 2 — Solução ── */}
      <section className="ic-zoom-section">
        <div className="ic-zoom-bg" style={{ background: "radial-gradient(ellipse 120% 100% at 30% 50%, #1e1a4a 0%, #0f1232 35%, #070b22 70%, #030b18 100%)" }}/>
        <div className="ic-zoom-overlay" style={{ background: "linear-gradient(to left, rgba(3,11,24,0.93) 38%, rgba(3,11,24,0.55) 70%, rgba(3,11,24,0.32) 100%)" }}/>
        <div className="ic-zoom-content" style={{ marginLeft: "auto", marginRight: 0, paddingLeft: 0, paddingRight: 80 }}>
          <div className="ic-zoom-label reveal">02 — Nossa abordagem</div>
          <h2 className="ic-zoom-title reveal">IA construída para<br/><span className="hl">o seu negócio.</span></h2>
          <p className="ic-zoom-body reveal">Não usamos soluções genéricas. Cada sistema que entregamos é arquitetado para o seu processo, integrado às suas ferramentas existentes e otimizado para os seus resultados — do primeiro sprint ao deploy em produção.</p>
          <div className="ic-zoom-tags reveal">
            {["Agentes Autônomos","LLM Integration","Workflow AI","API-First","RAG Systems"].map(t => <span className="ic-tag" key={t}>{t}</span>)}
          </div>
        </div>
        <div className="ic-zoom-deco" style={{ left: 0, right: "auto" }}>
          <div className="deco-ring deco-ring-1" style={{ background: "rgba(139,92,246,0.08)" }}/>
          <div className="deco-ring deco-ring-2" style={{ background: "rgba(99,102,241,0.05)" }}/>
          <div className="deco-ring deco-ring-3" style={{ background: "rgba(79,70,229,0.03)" }}/>
          <div className="deco-orb" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" }}/>
        </div>
      </section>

      {/* ── TABS — Produto ── */}
      <section className="ic-slides-section" id="processo">
        <div className="ic-slides-header">
          <div className="ic-section-badge reveal">03 — Como funciona</div>
          <h2 className="ic-section-title reveal">O que construímos<br/><span className="hl">para você.</span></h2>
          <p className="ic-section-sub reveal">Soluções de automação com IA que se encaixam no seu negócio — do agente ao pipeline completo.</p>
        </div>
        <div className="ic-slide-tabs reveal">
          {TABS.map((t,i) => <button key={t.label} className={`ic-tab ${activeTab===i?"active":""}`} onClick={() => setActiveTab(i)}>{t.label}</button>)}
        </div>
        {TABS.map((t,i) => (
          <div className={`ic-slide-panel ${activeTab===i?"active":""}`} key={t.num}>
            <div className="ic-slide-text">
              <div className="ic-slide-num">{t.num}</div>
              <h3 className="ic-slide-title">{t.title}</h3>
              <p className="ic-slide-body">{t.body}</p>
              <div className="ic-zoom-tags">{t.tags.map(tag => <span className="ic-tag" key={tag}>{tag}</span>)}</div>
            </div>
            <div className="ic-slide-visual">
              <div className="ic-vis-glow"/>
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
              <h2 className="ic-section-title reveal" style={{textAlign:"left"}}>O que entregamos<br/><span className="hl">em cada projeto</span></h2>
            </div>
            <Link href="/login" className="btn-ghost reveal">Conversar sobre automação →</Link>
          </div>
          {[
            {n:"01", name:"Desenvolvimento de Agentes IA",    desc:"Agentes autônomos customizados que executam processos complexos, interagem com APIs e aprendem com o contexto do seu negócio."},
            {n:"02", name:"Automação de Workflows",           desc:"Sistemas inteligentes conectando suas ferramentas — de n8n a Make, Zapier a pipelines customizados com tomada de decisão por IA."},
            {n:"03", name:"Integração com LLMs",              desc:"Deploy e integração de modelos como GPT-4, Claude e Llama diretamente nos seus sistemas, produtos e processos internos."},
            {n:"04", name:"Consultoria em Estratégia de IA",  desc:"Mapeamos seus processos e identificamos as maiores oportunidades de automação — com roadmap de implementação e ROI projetado."},
          ].map((s,i) => (
            <div className="ic-service-row reveal" key={s.n} style={{transitionDelay:`${i*60}ms`}}>
              <div className="ic-svc-num">{s.n}</div>
              <div><div className="ic-svc-name">{s.name}</div><div className="ic-svc-desc">{s.desc}</div></div>
              <div className="ic-svc-arrow"><Arrow size={20}/></div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ic-cta" id="contato">
        <div className="ic-cta-glow"/>
        <div className="ic-cta-inner">
          <h2 className="ic-cta-title reveal">Pronto para <span className="hl">automatizar</span><br/>seu negócio com IA?</h2>
          <p className="ic-cta-sub reveal">Converse com nossa equipe sobre o seu projeto. Em 48 horas você tem uma proposta técnica e um roadmap de automação personalizado.</p>
          <div className="ic-cta-actions reveal">
            <Link href="/login" className="btn-primary btn-lg">Falar com a equipe</Link>
            <a href="mailto:contato@iceandcode.com.br" className="btn-ghost btn-lg">contato@iceandcode.com.br</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ic-footer">
        <div className="ic-footer-top">
          <div>
            <Link href="/" className="ic-logo"><HexIcon size={20}/>Ice &amp; Code</Link>
            <p className="ic-footer-tagline">Agência de IA premium para automação de negócios.</p>
          </div>
          {[
            {title:"Serviços",  links:[["#solucoes","Agentes de IA"],["#processo","Automação de Workflows"],["#processo","Integração LLM"],["#","Consultoria"]]},
            {title:"Empresa",   links:[["#","Sobre nós"],["#","Cases"],["#","Blog"],["#","Carreiras"]]},
            {title:"Contato",   links:[["#precos","Investimento"],["#","Agendar reunião"],["mailto:contato@iceandcode.com.br","E-mail"]]},
          ].map(col => (
            <div className="ic-footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>{col.links.map(([href,label]) => <li key={label}><a href={href}>{label}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="ic-footer-bottom">
          <span>© 2025 Ice &amp; Code. Todos os direitos reservados.</span>
          <div className="ic-footer-legal"><a href="#">Privacidade</a><a href="#">Termos</a></div>
        </div>
      </footer>
    </>
  );
}

/* ── Node Break — canvas animated nodes/wind ─────── */
function NodeBreak() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const SERVICE_LABELS = ["Agent","Workflow","LLM","API","RAG","n8n","GPT-4","Claude","Vector DB","Zapier","IA"];

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      label: string | null;
      pulse: number;
    }

    const COUNT = 90;
    const particles: Particle[] = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random() * (W || 1200),
      y: Math.random() * (H || 600),
      vx: (Math.random() * 0.35 + 0.08),
      vy: (Math.random() * 0.18 - 0.09),
      r: i < 12 ? Math.random() * 2 + 2 : Math.random() * 1.2 + 0.6,
      alpha: Math.random() * 0.45 + 0.2,
      label: i < 11 ? SERVICE_LABELS[i] : null,
      pulse: Math.random() * Math.PI * 2,
    }));

    const MAX_DIST = 155;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.012;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy + Math.sin(t + p.pulse) * 0.06;
        p.pulse += 0.004;
        if (p.x > W + 20) p.x = -20;
        if (p.x < -20)    p.x = W + 20;
        if (p.y > H + 10) p.y = -10;
        if (p.y < -10)    p.y = H + 10;
      }

      // Lines between close nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const a = (1 - d / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(96,165,250,${a})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const p of particles) {
        const pulse = 0.85 + Math.sin(p.pulse * 2) * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${p.alpha})`;
        ctx.fill();

        if (p.label) {
          ctx.font = "9px Inter, sans-serif";
          ctx.fillStyle = `rgba(186,230,253,${p.alpha * 0.75})`;
          ctx.fillText(p.label, p.x + p.r + 4, p.y + 3);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="cloud-break">
      <div className="cloud-break-inner">
        {/* Node canvas */}
        <canvas
          ref={canvasRef}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}
        />
        {/* Subtle atmospheric blobs for depth */}
        <div className="cb-l1" style={{ opacity:0.4 }}/>
        <div className="cb-l3" style={{ opacity:0.3 }}/>
        <div className="cb-vignette"/>
        {/* Centre icon */}
        <div className="cb-ring"/>
        <div className="cb-icon"><HexIcon size={52}/></div>
      </div>
    </div>
  );
}

/* ── Tab Visuals ─────────────────────────────────── */
function VisAgente() {
  return (
    <div className="ic-vis-mockup">
      <div className="ic-vis-topbar"><span/><span/><span/></div>
      <div className="ic-vis-body">
        <div className="ic-vis-label">AI Agent — running</div>
        {["Receber input","Buscar contexto","Raciocinar","Executar ação","Retornar resultado"].map((step, i) => (
          <div key={step} className="ic-vis-row" style={{ alignItems:"center", gap:8 }}>
            <div className={`ic-vis-dot ${i < 3 ? "done" : i === 3 ? "active" : ""}`}/>
            <span style={{ fontSize:9, color: i < 3 ? "var(--blue-lt)" : i===3 ? "var(--white)" : "var(--muted)", fontFamily:"monospace" }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisWorkflow() {
  return (
    <div className="ic-vis-mockup">
      <div className="ic-vis-topbar"><span/><span/><span/></div>
      <div className="ic-vis-body">
        <div className="ic-vis-label">Workflow Automation</div>
        <div className="ic-vis-row" style={{ gap:6, flexWrap:"wrap", marginTop:8 }}>
          {["Trigger","Filter","IA Node","Transform","API Call","Notify"].map((n,i) => (
            <div key={n} style={{ display:"flex", alignItems:"center", gap:3 }}>
              <div className="ic-vis-chip" style={{ opacity: 1 - i * 0.08 }}>{n}</div>
              {i < 5 && <span style={{ color:"var(--blue-lt)", fontSize:8 }}>→</span>}
            </div>
          ))}
        </div>
        <div className="ic-vis-bar" style={{ width:"100%", marginTop:14 }}/>
        <div className="ic-vis-bar" style={{ width:"68%", marginTop:4, opacity:0.5 }}/>
      </div>
    </div>
  );
}

function VisLLM() {
  return (
    <div className="ic-vis-mockup">
      <div className="ic-vis-topbar"><span/><span/><span/></div>
      <div className="ic-vis-body">
        <div className="ic-vis-label">RAG Pipeline</div>
        {[
          { label:"Query",    val:"Como reduzir custos?",   w:"90%" },
          { label:"Retrieve", val:"3 chunks relevantes",    w:"75%" },
          { label:"Augment",  val:"Context + Query",        w:"82%" },
          { label:"Generate", val:"Resposta personalizada", w:"95%" },
        ].map(r => (
          <div key={r.label} className="ic-vis-row" style={{ gap:8, alignItems:"center" }}>
            <span style={{ fontSize:8, color:"var(--blue-lt)", width:48, flexShrink:0, fontFamily:"monospace" }}>{r.label}</span>
            <div className="ic-vis-bar" style={{ width:r.w, flexShrink:0 }}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────── */
function HexIcon({size=24}:{size?:number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
      <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.5"/>
      <circle cx="14" cy="14" r="2.5" fill="#3b82f6"/>
    </svg>
  );
}
function Arrow({size=16}:{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function Play({size=16}:{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/></svg>;
}
function CheckIcon({className}:{className?:string}) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
