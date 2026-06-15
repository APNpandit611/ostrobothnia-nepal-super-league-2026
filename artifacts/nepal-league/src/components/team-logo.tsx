import { useEffect, useState } from "react";

interface TeamLogoProps {
  name?: string | null;
  shortName?: string | null;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "w-6 h-6 text-[9px]",
  md: "w-9 h-9 text-xs",
  lg: "w-11 h-11 md:w-14 md:h-14 text-base md:text-lg",
} as const;

export function TeamLogo({ name, shortName, logoUrl, size = "md", className = "" }: TeamLogoProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [logoUrl]);

  const label = (shortName || name || "?").slice(0, 3).toUpperCase();
  const dims = SIZES[size];

  if (logoUrl && !errored) {
    return (
      <img
        src={logoUrl}
        alt={name ?? shortName ?? "Team"}
        className={`${dims} rounded-full object-cover bg-muted border flex-shrink-0 ${className}`}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      className={`${dims} rounded-full flex items-center justify-center bg-muted text-muted-foreground font-black border flex-shrink-0 ${className}`}
      aria-label={name ?? shortName ?? "Team"}
    >
      {label}
    </div>
  );
}
