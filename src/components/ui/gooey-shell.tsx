"use client";

import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";
import { Liquid, type LiquidProps } from "liquid-gooey";

/**
 * Superfície dos menus flutuantes = a do Luma (--menu-bg-color
 * rgba(35,35,35,.8) + backdrop-filter blur(16px) + outline 1px branco/8).
 * Não usa --ff-surface, então não puxa a cor da capa.
 *
 * O goo binariza o alpha (contraste), então um fill translúcido some; a cor vai
 * opaca e o .8 vai no SVG via --gooey-fill-opacity.
 */
export const GOOEY_FILL = "rgb(35,35,35)";
export const GOOEY_FILL_OPACITY = 0.8;

/** Blur do fundo (frost do Luma) para a camada que fica sobre o líquido. */
export const GOOEY_FROST = "backdrop-blur-[16px]";

/** Sigma do goo: perto de 6 os cantos quase não arredondam além do border-radius. */
export const GOOEY_BLUR = 6;

/**
 * Sombra em camadas (a do menu do Luma) como drop-shadow da silhueta fundida.
 * Sem anel `inset`: ele vira uma faixa de 1px binarizada (erode) e serrilha a borda.
 */
export const GOOEY_SHADOW =
  "0 1px 3px rgba(0,0,0,0.1), 0 3px 14px rgba(0,0,0,0.17), 0 7px 29px rgba(0,0,0,0.22)";

export type GooeyShellProps = LiquidProps & {
  /** Opacidade da silhueta líquida (0..1). Animável: tem transição de opacidade. */
  fillOpacity?: number;
  /** Duração (ms) e atraso da transição de opacidade da silhueta. */
  fadeMs?: number;
  fadeDelayMs?: number;
};

/**
 * Grupo `Liquid` com fill neutro. `blur` aqui é o sigma do goo
 * (distância em que as peças se fundem), não um backdrop.
 *
 * A opacidade do SVG e a transição dela são escritas direto no elemento
 * (useLayoutEffect), no mesmo commit da mudança de fase. Classe arbitrária do
 * Tailwind para isso não era gerada e caía nos 150ms padrão — o que fazia o
 * painel "clarear" ao fechar.
 */
export const GooeyShell = forwardRef<HTMLDivElement, GooeyShellProps>(
  function GooeyShell(
    {
      blur = GOOEY_BLUR,
      contrast = 20,
      fill = GOOEY_FILL,
      fillOpacity = GOOEY_FILL_OPACITY,
      fadeMs = 0,
      fadeDelayMs = 0,
      shadow = GOOEY_SHADOW,
      ...rest
    },
    ref,
  ) {
    const groupRef = useRef<HTMLDivElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        groupRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    useLayoutEffect(() => {
      const svg = groupRef.current?.querySelector<SVGSVGElement>(
        ":scope > svg[data-gooey-svg]",
      );
      if (!svg) return;
      svg.style.transition =
        fadeMs > 0 ? `opacity ${fadeMs}ms ease-out ${fadeDelayMs}ms` : "none";
      svg.style.opacity = String(fillOpacity);
    });

    return (
      <Liquid
        ref={setRefs}
        blur={blur}
        contrast={contrast}
        fill={fill}
        shadow={shadow}
        {...rest}
      />
    );
  },
);

export const GooeyItem = Liquid.Item;
