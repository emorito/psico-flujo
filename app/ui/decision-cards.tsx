"use client";

import { useMemo } from "react";
import { ArrowRight, Layers } from "lucide-react";
import ambitosData from "../../data/ambitos.json";
import { catalog } from "./instrument-library";

interface DecisionCardsProps {
  ambitoId: string;
  onSelectSeccion: (seccionId: string) => void;
  selectedSeccion?: string;
}

export function DecisionCards({ ambitoId, onSelectSeccion, selectedSeccion }: DecisionCardsProps) {
  const currentAmbito = ambitosData.find(
    (a) => a.id === ambitoId || (ambitoId === "forense" && a.id === "juridico")
  );

  const sectionsWithCounts = useMemo(() => {
    if (!currentAmbito) return [];
    const aid = currentAmbito.id;

    return currentAmbito.secciones.map((sec, idx) => {
      const count = catalog.filter((item) => {
        const itemAmbitos = item.ambitos || [];
        if (!itemAmbitos.includes(aid)) return false;
        const itemSec = item.secciones?.[aid];
        if (Array.isArray(itemSec)) return itemSec.includes(sec.id);
        return itemSec === sec.id;
      }).length;

      return {
        ...sec,
        index: idx + 1,
        count,
      };
    });
  }, [currentAmbito]);

  if (!currentAmbito || sectionsWithCounts.length === 0) return null;

  const handleCardClick = (secId: string) => {
    onSelectSeccion(secId);
    const el = document.getElementById("biblioteca");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="decision-cards-section" aria-label={`Dimensiones de decisión para ${currentAmbito.nombre}`}>
      <div className="decision-cards-header">
        <div className="decision-title-group">
          <span className="decision-pre-badge">
            <Layers size={14} />
            <span>Dimensiones de Decisión Profesional</span>
          </span>
          <h2>Dimensiones Rectoras para {currentAmbito.nombre}</h2>
          <p className="decision-lead">
            {currentAmbito.pregunta_rectora}
          </p>
        </div>
        <div className="decision-summary-meta">
          <span>{sectionsWithCounts.length} dimensiones</span>
          <span>·</span>
          <span>
            {sectionsWithCounts.reduce((acc, s) => acc + s.count, 0)} instrumentos catalogados
          </span>
        </div>
      </div>

      <div className="decision-cards-grid">
        {sectionsWithCounts.map((sec) => {
          const isSelected = selectedSeccion === sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleCardClick(sec.id)}
              className={`decision-card ${isSelected ? "is-selected" : ""}`}
              aria-pressed={isSelected}
            >
              <div className="decision-card-top">
                <span className="decision-card-num">Dimensión {sec.index}</span>
                <span className="decision-card-count">{sec.count} inst.</span>
              </div>

              <h3 className="decision-card-title">{sec.titulo}</h3>
              <p className="decision-card-desc">{sec.criterio}</p>

              <div className="decision-card-footer">
                <span className="decision-card-action">
                  <span>{isSelected ? "Dimensión seleccionada" : "Explorar en catálogo"}</span>
                  <ArrowRight size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
