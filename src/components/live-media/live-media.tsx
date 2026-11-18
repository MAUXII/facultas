"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  /** Mostrado no lugar da imagem quando ela não carrega. */
  fallback?: ReactNode;
};

export function LiveMedia({ src, alt = "", className, fallback }: Props) {
  const [broken, setBroken] = useState(false);

  useEffect(() => setBroken(false), [src]);

  if (broken && fallback !== undefined) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      // Fotos do Google recusam o carregamento quando recebem o referrer.
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}
