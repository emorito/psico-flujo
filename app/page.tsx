export default function MaintenancePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        backgroundColor: "#0b0f19",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          padding: "3rem 2rem",
          backgroundColor: "#111827",
          borderRadius: "16px",
          border: "1px solid #1f2937",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#60a5fa",
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-display, inherit)",
          }}
        >
          <span>psico·flujo</span>
        </div>

        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.025em",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            PÁGINA EN MANTENIMIENTO
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: "1.6",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Estamos realizando tareas de revisión y mantenimiento en la plataforma.
            Volveremos a estar disponibles a la brevedad.
          </p>
        </div>

        <div
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "0.875rem",
            color: "#64748b",
          }}
        >
          Disculpe las molestias ocasionadas.
        </div>
      </div>
    </main>
  );
}
