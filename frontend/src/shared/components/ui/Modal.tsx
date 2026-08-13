import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { PropsWithChildren } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea",
  "input",
  "select",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface ModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
}

function Modal({ open, onClose, title, description, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const trigger = document.activeElement;

    document.body.style.overflow = "hidden";
    focusFirst(panelRef.current);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key === "Tab") {
        trapFocus(panelRef.current, event);
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "";
      if (trigger instanceof HTMLElement) {
        trigger.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-obsidian/70"
        data-testid="modal-overlay"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-modal border border-parchment/8 bg-charcoal p-6 shadow-modal"
      >
        <h2 id={titleId} className="font-heading text-2xl text-parchment">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-fog">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function focusFirst(container: HTMLElement | null): void {
  const [first] = getFocusableElements(container);
  if (first) {
    first.focus();
    return;
  }
  container?.focus();
}

function trapFocus(container: HTMLElement | null, event: KeyboardEvent): void {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const focusInside = container?.contains(active) ?? false;

  if (event.shiftKey && (active === first || !focusInside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !focusInside)) {
    event.preventDefault();
    first.focus();
  }
}

export default Modal;
