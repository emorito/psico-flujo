import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock3,
  Compass,
  FileCheck2,
  Layers3,
  Search,
  ShieldCheck,
} from "lucide-react";
import { InstrumentLibrary } from "./ui/instrument-library";

const axes = [
  { n: "01", title: "Problemas, síntomas y riesgo", short: "Clínica y riesgo", ready: true },
  { n: "02", title: "Procesos psicológicos", short: "Mecanismos", ready: false },
  { n: "03", title: "Características de la persona", short: "Rasgos e identidad", ready: false },
  { n: "04", title: "Funcionamiento y recursos", short: "Adaptación", ready: false },
  { n: "05", title: "Funcionamiento cognitivo", short: "Cognición", ready: false },
  { n: "06", title: "Salud y estilo de vida", short: "Salud integral", ready: false },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Psico Flujo, inicio">
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>psico<span>·</span>flujo</span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#modelo">Modelo</a>
          <a href="#biblioteca">Instrumentos</a>
          <a className="nav-action" href="#biblioteca">
            Abrir biblioteca <ArrowDown size={15} />
          </a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-backdrop" />
        <div className="hero-content">
          <div className="hero-badge">
            <span />
            Biblioteca clínica en evolución
          </div>
          <h1>
            Evaluar es trazar<br />
            <span>un mapa para comprender.</span>
          </h1>
          <p>
            Instrumentos de evaluación psicológica organizados en una
            arquitectura clínica clara, accesible y en permanente construcción.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#biblioteca">
              Explorar Eje I <ArrowRight size={16} />
            </a>
            <a className="button button-ghost" href="#modelo">
              Conocer los seis ejes
            </a>
          </div>
        </div>
        <div className="hero-stats" aria-label="Resumen de la colección">
          <div><strong>43</strong><span>instrumentos</span></div>
          <div><strong>104</strong><span>documentos</span></div>
          <div><strong>09</strong><span>áreas clínicas</span></div>
          <div className="hero-status"><i /><span>Eje I disponible</span></div>
        </div>
      </section>

      <section className="model-section" id="modelo">
        <div className="section-intro">
          <div>
            <span className="overline"><Compass size={14} /> Arquitectura Psico·Flujo</span>
            <h2>Seis rutas para una mirada integral.</h2>
          </div>
          <p>
            Un sistema que ordena la evaluación sin reducir su complejidad.
            Cada eje reúne instrumentos relacionados con una dimensión esencial
            de la formulación clínica.
          </p>
        </div>

        <div className="axes-list">
          {axes.map((axis) =>
            axis.ready ? (
              <a className="axis-row axis-row-ready" href="#biblioteca" key={axis.n}>
                <span className="axis-index">{axis.n}</span>
                <span className="axis-dot" />
                <span className="axis-copy"><strong>{axis.title}</strong><small>{axis.short}</small></span>
                <span className="axis-state"><Check size={13} /> Disponible</span>
                <ArrowRight className="axis-arrow" size={18} />
              </a>
            ) : (
              <div className="axis-row axis-row-muted" aria-disabled="true" key={axis.n}>
                <span className="axis-index">{axis.n}</span>
                <span className="axis-dot" />
                <span className="axis-copy"><strong>{axis.title}</strong><small>{axis.short}</small></span>
                <span className="axis-state"><Clock3 size={13} /> En construcción</span>
                <span className="axis-arrow-placeholder" />
              </div>
            )
          )}
        </div>
      </section>

      <section className="collection-banner" id="biblioteca">
        <div>
          <span className="collection-number">EJE 01</span>
          <h2>Problemas, síntomas<br />y riesgo</h2>
        </div>
        <p>
          Recursos para reconocer manifestaciones clínicas, estimar severidad,
          explorar riesgo y apoyar la formulación del caso.
        </p>
        <div className="collection-features">
          <span><Search size={17} /> Tamizaje y selección inicial</span>
          <span><Layers3 size={17} /> Seguimiento clínico</span>
          <span><FileCheck2 size={17} /> Fichas y protocolos</span>
        </div>
      </section>

      <InstrumentLibrary />

      <section className="responsible-use">
        <ShieldCheck size={22} />
        <div>
          <strong>Uso profesional responsable</strong>
          <p>
            Los instrumentos complementan la entrevista y el juicio clínico.
            Ninguna escala constituye, por sí sola, un diagnóstico.
          </p>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
          <span>psico<span>·</span>flujo</span>
        </a>
        <p>Biblioteca de instrumentos de evaluación psicológica.</p>
        <span>Portal en evolución · 2026</span>
      </footer>
    </main>
  );
}
