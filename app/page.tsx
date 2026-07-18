import { ArrowDown, ArrowUpRight, Check, CircleDot, Clock3, Download, ShieldCheck, Sparkles } from "lucide-react";
import { InstrumentLibrary } from "./ui/instrument-library";

const axes = [
  { n: "I", title: "Problemas, síntomas y riesgo", description: "Detección y caracterización de síntomas clínicos, conductas de riesgo y malestar psicológico.", ready: true },
  { n: "II", title: "Procesos psicológicos", description: "Mecanismos de mantenimiento, regulación emocional y procesos transdiagnósticos.", ready: false },
  { n: "III", title: "Características de la persona", description: "Rasgos, estilos personales, identidad y patrones relativamente estables.", ready: false },
  { n: "IV", title: "Funcionamiento y recursos", description: "Adaptación cotidiana, calidad de vida, redes de apoyo y fortalezas personales.", ready: false },
  { n: "V", title: "Funcionamiento cognitivo", description: "Atención, memoria, funciones ejecutivas y desempeño neuropsicológico.", ready: false },
  { n: "VI", title: "Salud y estilo de vida", description: "Salud física, hábitos, sueño y variables relevantes para la medicina conductual.", ready: false },
];

export default function Home() {
  return (
    <main>
      <header className="nav-shell">
        <a className="brand" href="#inicio" aria-label="Psico Flujo, inicio">
          <span className="brand-mark"><CircleDot size={19} /></span>
          <span>psico<span>·</span>flujo</span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#ejes">Los ejes</a>
          <a href="#biblioteca">Biblioteca</a>
          <a className="nav-cta" href="#biblioteca">Explorar Eje I <ArrowDown size={15} /></a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-glow" />
        <div className="eyebrow"><Sparkles size={14} /> Una biblioteca clínica en evolución</div>
        <h1>Instrumentos para evaluar.<br /><em>Criterio para comprender.</em></h1>
        <p className="hero-copy">Un punto de acceso claro y cuidadosamente organizado a recursos de evaluación psicológica para la práctica, la docencia y la investigación.</p>
        <div className="hero-actions">
          <a className="button primary" href="#biblioteca">Explorar instrumentos <ArrowDown size={17} /></a>
          <a className="button secondary" href="#ejes">Conocer el modelo <ArrowUpRight size={17} /></a>
        </div>
        <div className="hero-note"><span className="pulse" /> Primera colección disponible: Eje I</div>
      </section>

      <section className="manifesto">
        <p className="section-kicker">El proyecto</p>
        <div>
          <h2>Una arquitectura común para una evaluación más integrada.</h2>
          <p>Este portal crecerá por etapas hasta reunir seis ejes complementarios. Cada colección prioriza la consulta ágil, la trazabilidad documental y el uso profesional responsable.</p>
        </div>
        <div className="principles">
          <div><span>01</span><strong>Organización clínica</strong><p>Recursos agrupados por el área que ayudan a explorar.</p></div>
          <div><span>02</span><strong>Acceso directo</strong><p>Escalas, fichas y materiales de apoyo en un mismo lugar.</p></div>
          <div><span>03</span><strong>Evolución continua</strong><p>Una base preparada para crecer e integrarse con Psico·Flujo.</p></div>
        </div>
      </section>

      <section className="axes-section" id="ejes">
        <div className="section-heading">
          <div><p className="section-kicker">Mapa de evaluación</p><h2>Seis ejes, una mirada integral.</h2></div>
          <p>El Eje I ya está disponible. Los siguientes se incorporarán progresivamente a medida que finalice su revisión.</p>
        </div>
        <div className="axes-grid">
          {axes.map((axis) => axis.ready ? (
            <a className="axis-card axis-ready" href="#biblioteca" key={axis.n}>
              <span className="axis-number">{axis.n}</span>
              <span className="status ready"><Check size={13} /> Disponible</span>
              <h3>{axis.title}</h3><p>{axis.description}</p>
              <span className="axis-link">Abrir colección <ArrowDown size={16} /></span>
            </a>
          ) : (
            <article className="axis-card axis-disabled" key={axis.n}>
              <span className="axis-number">{axis.n}</span>
              <span className="status"><Clock3 size={13} /> En construcción</span>
              <h3>{axis.title}</h3><p>{axis.description}</p>
              <span className="axis-link">Próximamente</span>
            </article>
          ))}
        </div>
      </section>

      <section className="axis-intro" id="biblioteca">
        <div className="axis-intro-top">
          <div className="roman">I</div>
          <div><p className="section-kicker light">Colección disponible</p><h2>Problemas, síntomas<br />y riesgo</h2></div>
          <p>Instrumentos de tamizaje y evaluación orientados a reconocer manifestaciones clínicas, estimar severidad y apoyar la formulación del caso.</p>
        </div>
        <div className="usage-strip">
          <div><ShieldCheck size={20} /><span><strong>Uso recomendado</strong>Selección inicial, seguimiento clínico y apoyo a la entrevista.</span></div>
          <div><Download size={20} /><span><strong>Documentación</strong>Escalas, fichas técnicas, manuales y versiones complementarias.</span></div>
          <p>Los instrumentos complementan —no sustituyen— el juicio clínico ni constituyen por sí solos un diagnóstico.</p>
        </div>
      </section>

      <InstrumentLibrary />

      <footer>
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark"><CircleDot size={19} /></span><span>psico<span>·</span>flujo</span></a>
        <p>Biblioteca de instrumentos de evaluación psicológica.</p>
        <span>Portal en evolución · Eje I</span>
      </footer>
    </main>
  );
}
