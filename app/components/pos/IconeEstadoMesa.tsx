import type {
  POSMobileEstadoVisualMesa as EstadoVisualMesa,
} from "@/types/estado-mesas";

interface IconeEstadoMesaProps {
  estado: EstadoVisualMesa;
  className?: string;
}

function obterClassesEstado(
  estado: EstadoVisualMesa,
): string {
  switch (estado) {
    case "OCUPADA":
      return "bg-rose-100 text-rose-600 ring-rose-200";

    case "EM_USO":
      return "bg-blue-100 text-blue-600 ring-blue-200";

    case "RESERVADA":
      return "bg-amber-100 text-amber-600 ring-amber-200";

    case "BLOQUEADA":
      return "bg-slate-200 text-slate-600 ring-slate-300";

    default:
      return "bg-emerald-100 text-emerald-600 ring-emerald-200";
  }
}

export default function IconeEstadoMesa({
  estado,
  className = "",
}: IconeEstadoMesaProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
        obterClassesEstado(
          estado,
        ),
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="h-6 w-6"
      >
        <rect
          x="9"
          y="9"
          width="14"
          height="14"
          rx="4"
          fill="currentColor"
          opacity="0.16"
        />

        <rect
          x="10"
          y="10"
          width="12"
          height="12"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="13"
          y="4.5"
          width="6"
          height="3"
          rx="1.2"
          fill="currentColor"
        />

        <rect
          x="13"
          y="24.5"
          width="6"
          height="3"
          rx="1.2"
          fill="currentColor"
        />

        <rect
          x="4.5"
          y="13"
          width="3"
          height="6"
          rx="1.2"
          fill="currentColor"
        />

        <rect
          x="24.5"
          y="13"
          width="3"
          height="6"
          rx="1.2"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}