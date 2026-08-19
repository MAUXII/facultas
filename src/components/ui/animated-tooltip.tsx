"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { glassVariantStyles } from "@/lib/glass-variants";

export const AnimatedTooltip = ({
  items,
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    image: string;
  }[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="flex items-center">
      {items.map((item, idx) => {
        const active = hoveredIndex === item.id;
        return (
          <div
            key={`${item.id}-${item.name}`}
            className="relative h-9 w-9 shrink-0"
            style={{
              marginLeft: idx === 0 ? 0 : -10,
              zIndex: items.length - idx,
            }}
            onMouseEnter={() => setHoveredIndex(item.id)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {active ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94, x: "-50%" }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    x: "-50%",
                    transition: {
                      type: "spring",
                      stiffness: 320,
                      damping: 22,
                    },
                  }}
                  exit={{ opacity: 0, y: 6, scale: 0.96, x: "-50%" }}
                  className={cn(
                    glassVariantStyles.frosted,
                    "pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2.5 flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs",
                  )}
                >
                  <div className="text-sm font-medium text-white">
                    {item.name}
                  </div>
                  {item.designation ? (
                    <div className="text-[11px] text-white/45">
                      {item.designation}
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height={36}
              width={36}
              src={item.image}
              alt={item.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
};
