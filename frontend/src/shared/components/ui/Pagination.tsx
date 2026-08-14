import { useRef } from "react";
import type { KeyboardEvent } from "react";

type PageItem = number | "ellipsis";

function pageRange(totalPages: number, currentPage: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const windowPages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sorted = [...windowPages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) items.push("ellipsis");
    items.push(page);
    previous = page;
  }
  return items;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const NAV_BUTTON_CLASSES =
  "rounded-button border border-graphite px-3 py-1.5 text-sm text-fog transition-colors duration-200 hover:bg-charcoal hover:text-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-gold disabled:cursor-not-allowed disabled:opacity-50";

const PAGE_BUTTON_CLASSES =
  "h-9 min-w-9 rounded-button px-2 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-gold disabled:opacity-50";

function Pagination({ currentPage, totalPages, onPageChange, isLoading = false }: PaginationProps) {
  const navRef = useRef<HTMLElement>(null);

  if (totalPages <= 1) return null;

  const items = pageRange(totalPages, currentPage);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const current = event.target as HTMLElement;
    if (current.tagName !== "BUTTON") return;
    const buttons = Array.from(
      navRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const index = buttons.indexOf(current as HTMLButtonElement);
    const nextIndex = event.key === "ArrowRight" ? index + 1 : index - 1;
    if (nextIndex >= 0 && nextIndex < buttons.length) {
      event.preventDefault();
      buttons[nextIndex].focus();
    }
  }

  return (
    <nav
      ref={navRef}
      aria-label="Pagination"
      onKeyDown={handleKeyDown}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isLoading || isFirst}
        className={NAV_BUTTON_CLASSES}
      >
        Previous
      </button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="px-1 text-sm text-ash"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            disabled={isLoading}
            aria-current={item === currentPage ? "page" : undefined}
            aria-label={`Go to page ${item}`}
            className={`${PAGE_BUTTON_CLASSES} ${
              item === currentPage
                ? "bg-antique-gold font-medium text-obsidian hover:bg-burnished-gold"
                : "text-fog hover:bg-charcoal hover:text-parchment"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLoading || isLast}
        className={NAV_BUTTON_CLASSES}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;