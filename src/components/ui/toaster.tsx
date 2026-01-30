import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";

/**
 * Centralized toast container.
 * Styling in src/index.css: toasts at top (e.g. 120px), horizontally centered
 * (no jumping); one line, no wrap; toast stretches horizontally to fit text.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      richColors
      position="top-center"
      offset={0}
      expand={false}
      toastOptions={{
        classNames: {
          toast: "!text-center rounded-lg border shadow-md",
          title: "!text-center",
          description: "!text-center",
          actionButton: "text-xs",
          cancelButton: "text-xs",
        },
      }}
      {...props}
    />
  );
}
