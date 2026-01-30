import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "slide" | "fade" | "scale" | "slideScale";
}

const variants = {
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideScale: {
    initial: { opacity: 0, x: 30, scale: 0.96 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -30, scale: 0.96 },
  },
};

const transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
};

export function PageTransition({ children, variant = "slideScale" }: PageTransitionProps) {
  const variantConfig = variants[variant];

  return (
    <motion.div
      initial={variantConfig.initial}
      animate={variantConfig.animate}
      exit={variantConfig.exit}
      transition={transition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
