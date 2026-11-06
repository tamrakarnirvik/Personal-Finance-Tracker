
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";

export function PageTransition({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        initial={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: 8 }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: reduceMotion ? 0 : 0.2,
          ease: "easeOut",
        }}
        className="min-w-0"
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
