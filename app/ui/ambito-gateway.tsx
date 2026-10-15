"use client";

import Link from "next/link";
import { 
  Compass, 
  GraduationCap, 
  Briefcase, 
  Scale, 
  Activity, 
  Trophy, 
  Globe2, 
  Stethoscope, 
  LayoutGrid,
  ArrowLeft
} from "lucide-react";
import ambitosData from "../../data/ambitos.json";

interface AmbitoGatewayProps {
  currentAmbito: string;
  onSelectAmbito?: (ambitoId: string) => void;
  instrumentCount?: number;
}

const AMBITO_LINKS = [
  { id: "all", href: "/", label: "General · Multieje", short: "General", count: 270, icon: LayoutGrid },
  { id: "clinico", href: "/clinico", label: "Clínica y Psicoterapia", short: "Clínica", count: 229, icon: Stethoscope },
  { id: "educativo", href: "/educativa", label: "Psicología Educativa", short: "Educativa", count: 80, icon: GraduationCap },
  { id: "vocacional", href: "/vocacional", label: "Orientación Vocacional", short: "Vocacional", count: 18, icon: Compass },
  { id: "salud", href: "/salud", label: "Salud y Neuropsicología", short: "Salud", count: 76, icon: Activity },
  { id: "laboral", href: "/laboral", label: "Laboral y Organizacional", short: "Laboral", count: 40, icon: Briefcase },
  { id: "juridico", href: "/forense", label: "Jurídica y Forense", short: "Forense", count: 36, icon: Scale },
  { id: "deporte", href: "/deporte", label: "Deporte y Rendimiento", short: "Deporte", count: 9, icon: Trophy },
  { id: "cultural", href: "/cultural", label: "Cultural y Comunitaria", short: "Cultural", count: 8, icon: Globe2 },
];

export function AmbitoGateway({ currentAmbito, onSelectAmbito }: AmbitoGatewayProps) {
  const isCustomAmbito = currentAmbito && currentAmbito !== "all";
  const activeData = ambitosData.find(
    (a) => a.id === currentAmbito || (currentAmbito === "forense" && a.id === "juridico")
  );

  return (
    <div className={`ambito-gateway ${isCustomAmbito ? "is-active-mode" : ""}`}>
      {/* 1. Barra contextual destacada cuando un ámbito está activo */}
      {isCustomAmbito && (
        <div className="gateway-context-bar">
          <div className="gateway-context-info">
            <span className="gateway-active-badge">
              Modo Activo: {activeData?.nombre || currentAmbito}
            </span>
            <span className="gateway-context-hint">
              Entorno configurado para evaluación disciplinar específica
            </span>
          </div>

          <Link href="/" className="gateway-return-btn" aria-label="Volver a la vista general multieje">
            <ArrowLeft size={16} />
            <span>Volver a la Vista General (6 Ejes)</span>
          </Link>
        </div>
      )}

      {/* 2. Barra de orientación con explicación superior concisa */}
      <div className="gateway-nav-container">
        <div className="gateway-prompt">
          <span className="gateway-prompt-label">
            {isCustomAmbito 
              ? "Cambiar a otra área de evaluación profesional:" 
              : "Selecciona el área de evaluación para adaptar PsicoFlujo a tu contexto, o explora la vista general:"}
          </span>
        </div>

        <nav className="gateway-pills-row" aria-label="Selector de áreas de evaluación">
          {AMBITO_LINKS.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentAmbito === item.id || (item.id === "juridico" && currentAmbito === "forense");

            if (onSelectAmbito) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectAmbito(item.id)}
                  className={`gateway-pill ${isActive ? "active" : ""}`}
                  data-ambito-btn={item.id}
                  aria-pressed={isActive}
                >
                  <IconComponent size={14} className="gateway-pill-icon" />
                  <span className="gateway-pill-name">{item.short}</span>
                  <span className="gateway-pill-count">{item.count}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`gateway-pill ${isActive ? "active" : ""}`}
                data-ambito-btn={item.id}
                aria-current={isActive ? "page" : undefined}
              >
                <IconComponent size={14} className="gateway-pill-icon" />
                <span className="gateway-pill-name">{item.short}</span>
                <span className="gateway-pill-count">{item.count}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
