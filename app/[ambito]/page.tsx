import type { Metadata } from "next";
import { PsicoflujoView } from "../ui/psicoflujo-view";
import ambitosData from "../../data/ambitos.json";

export function generateStaticParams() {
  return [
    { ambito: "educativo" },
    { ambito: "educativa" },
    { ambito: "vocacional" },
    { ambito: "salud" },
    { ambito: "laboral" },
    { ambito: "juridico" },
    { ambito: "forense" },
    { ambito: "clinico" },
    { ambito: "clinica" },
    { ambito: "deporte" },
    { ambito: "cultural" },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ ambito: string }> }): Promise<Metadata> {
  const { ambito } = await params;
  let resolved = ambito;
  if (ambito === "educativa") resolved = "educativo";
  if (ambito === "forense") resolved = "juridico";
  if (ambito === "clinica") resolved = "clinico";

  const amb = ambitosData.find((a) => a.id === resolved);
  if (!amb) {
    return {
      title: "Psico·Flujo | Biblioteca de evaluación psicológica",
    };
  }

  return {
    title: `${amb.nombre} | Psico·Flujo`,
    description: `${amb.descripcion} Pregunta rectora: ${amb.pregunta_rectora}`,
    openGraph: {
      title: `${amb.nombre} | Psico·Flujo`,
      description: amb.descripcion,
    },
  };
}

export default async function AmbitoPage({ params }: { params: Promise<{ ambito: string }> }) {
  const { ambito } = await params;
  let resolved = ambito;
  if (ambito === "educativa") resolved = "educativo";
  if (ambito === "forense") resolved = "juridico";
  if (ambito === "clinica") resolved = "clinico";

  return <PsicoflujoView initialAmbito={resolved} />;
}
