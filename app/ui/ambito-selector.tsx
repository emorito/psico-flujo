"use client";

import React, { useMemo } from "react";
import {
  Layers,
  GraduationCap,
  Compass,
  Briefcase,
  Scale,
  Brain,
  Trophy,
  Globe,
  HelpCircle,
  ShieldAlert,
  X,
} from "lucide-react";
import ambitosData from "../../data/ambitos.json";

export interface AmbitoInfo {
  id: string;
  nombre: string;
  nombre_corto?: string;
  pregunta_rectora: string;
  descripcion: string;
  color_tema: {
    primary: string;
    primary_dark: string;
    primary_light: string;
    accent_border: string;
    badge_bg: string;
    badge_text: string;
  };
  secciones: {
    id: string;
    titulo: string;
    criterio: string;
  }[];
  filtros_por_defecto: {
    franjas: string[];
    ejes: string[];
  };
  advertencia: string;
  instrumentos_destacados: string[];
}

export const AMBITOS: AmbitoInfo[] = ambitosData as AmbitoInfo[];

interface AmbitoSelectorProps {
  selectedAmbito: string;
  onSelectAmbito: (ambitoId: string) => void;
  selectedSeccion?: string;
  onSelectSeccion?: (seccionId: string) => void;
  catalogCounts?: Record<string, number>;
  totalCount?: number;
}

export function AmbitoSelector({
  selectedAmbito,
  onSelectAmbito,
  selectedSeccion = "all",
  onSelectSeccion,
  catalogCounts = {},
  totalCount = 270,
}: AmbitoSelectorProps) {
  // Encontrar el ámbito activo
  const activeAmbito = useMemo(() => {
    if (selectedAmbito === "all" || selectedAmbito === "general") return null;
    return AMBITOS.find((a) => a.id === selectedAmbito) || null;
  }, [selectedAmbito]);

  // Ícono según ámbito
  const getAmbitoIcon = (id: string, size = 16) => {
    switch (id) {
      case "educativo":
        return <GraduationCap size={size} />;
      case "vocacional":
        return <Compass size={size} />;
      case "laboral":
        return <Briefcase size={size} />;
      case "juridico":
        return <Scale size={size} />;
      case "salud":
        return <Brain size={size} />;
      case "deporte":
        return <Trophy size={size} />;
      case "cultural":
        return <Globe size={size} />;
      default:
        return <Layers size={size} />;
    }
  };

  return (
    <div className="ambito-master-container" data-ambito={selectedAmbito}>
      {/* 1. Barra horizontal moderna de selección de ámbitos */}
      <div className="ambito-nav-wrapper">
        <div className="ambito-nav-header">
          <span className="ambito-label-tag">Áreas de Evaluación y Enfoques de Decisión</span>
          <span className="ambito-hint">Explora instrumentos según el contexto disciplinar</span>
        </div>

        <div className="ambito-pills-row" role="tablist" aria-label="Seleccionar área de evaluación">
          {/* Opción General (Base Canónica por Ejes) */}
          <button
            type="button"
            role="tab"
            aria-selected={selectedAmbito === "all" || selectedAmbito === "general"}
            className={`ambito-pill ${selectedAmbito === "all" || selectedAmbito === "general" ? "active general" : ""}`}
            onClick={() => {
              onSelectAmbito("all");
              if (onSelectSeccion) onSelectSeccion("all");
            }}
          >
            <span className="ambito-pill-icon"><Layers size={15} /></span>
            <span className="ambito-pill-title">General · Multieje</span>
            <span className="ambito-pill-badge">{totalCount}</span>
          </button>

          {/* Lista de ámbitos disciplinares */}
          {AMBITOS.map((amb) => {
            const isSelected = selectedAmbito === amb.id;
            const count = catalogCounts[amb.id] || 0;
            return (
              <button
                key={amb.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`ambito-pill ${isSelected ? "active" : ""}`}
                style={
                  isSelected
                    ? ({
                        "--current-accent": amb.color_tema.primary,
                        "--current-bg": amb.color_tema.primary_light,
                        "--current-border": amb.color_tema.accent_border,
                        "--current-text": amb.color_tema.badge_text,
                      } as React.CSSProperties)
                    : undefined
                }
                onClick={() => {
                  onSelectAmbito(isSelected ? "all" : amb.id);
                  if (onSelectSeccion) onSelectSeccion("all");
                }}
              >
                <span className="ambito-pill-icon">{getAmbitoIcon(amb.id, 15)}</span>
                <span className="ambito-pill-title">{amb.nombre_corto || amb.nombre}</span>
                <span className="ambito-pill-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tarjeta / Banner de Orientación Disciplinar del Ámbito Activo */}
      {activeAmbito && (
        <aside
          className="ambito-orientation-card"
          style={
            {
              "--current-accent": activeAmbito.color_tema.primary,
              "--current-dark": activeAmbito.color_tema.primary_dark,
              "--current-bg": activeAmbito.color_tema.primary_light,
              "--current-border": activeAmbito.color_tema.accent_border,
              "--current-badge-bg": activeAmbito.color_tema.badge_bg,
              "--current-badge-text": activeAmbito.color_tema.badge_text,
            } as React.CSSProperties
          }
          aria-label={`Guía y decisiones en ${activeAmbito.nombre}`}
        >
          <div className="ambito-card-topbar">
            <div className="ambito-card-title-group">
              <span className="ambito-icon-badge">{getAmbitoIcon(activeAmbito.id, 18)}</span>
              <div>
                <h3>{activeAmbito.nombre}</h3>
                <span className="ambito-count-indicator">
                  {catalogCounts[activeAmbito.id] || 0} instrumentos catalogados para esta área
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ambito-card-close-btn"
              onClick={() => {
                onSelectAmbito("all");
                if (onSelectSeccion) onSelectSeccion("all");
              }}
              aria-label="Volver a la vista general por ejes"
              title="Volver a la vista general por ejes"
            >
              <span>Restablecer vista general</span>
              <X size={15} />
            </button>
          </div>

          {/* Pregunta Rectora Destacada */}
          <div className="ambito-question-banner">
            <div className="ambito-question-icon">
              <HelpCircle size={17} />
            </div>
            <div className="ambito-question-content">
              <span className="ambito-question-lead">Pregunta de Decisión Clínica y Profesional:</span>
              <p className="ambito-question-quote">“{activeAmbito.pregunta_rectora}”</p>
            </div>
          </div>

          {/* Sub-secciones o Preguntas de Decisión Específicas */}
          {activeAmbito.secciones && activeAmbito.secciones.length > 0 && onSelectSeccion && (
            <div className="ambito-sections-block">
              <div className="ambito-sections-label">
                <span>Ejes de decisión psicopedagógica y clínica:</span>
              </div>
              <div className="ambito-sections-pills">
                <button
                  type="button"
                  className={`section-pill ${selectedSeccion === "all" ? "active" : ""}`}
                  onClick={() => onSelectSeccion("all")}
                >
                  <span>Todos en {activeAmbito.nombre_corto || "este ámbito"}</span>
                </button>
                {activeAmbito.secciones.map((sec, idx) => {
                  const isSecSelected = selectedSeccion === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      className={`section-pill ${isSecSelected ? "active" : ""}`}
                      onClick={() => onSelectSeccion(isSecSelected ? "all" : sec.id)}
                      title={sec.criterio}
                    >
                      <span className="section-pill-num">{idx + 1}</span>
                      <span>{sec.titulo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advertencia Ética y Deontológica */}
          <div className="ambito-card-warning">
            <ShieldAlert size={15} />
            <p>{activeAmbito.advertencia}</p>
          </div>
        </aside>
      )}
    </div>
  );
}
