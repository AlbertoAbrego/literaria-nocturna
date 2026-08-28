import type { HTMLAttributes, PropsWithChildren, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableElement>>) {
  return (
    <div className="overflow-hidden rounded-card border border-parchment/8 bg-charcoal">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left" {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHeader({ children }: PropsWithChildren) {
  return (
    <thead>
      <tr className="border-b border-parchment/8">{children}</tr>
    </thead>
  );
}

export function TableHead({
  children,
  ...props
}: PropsWithChildren<ThHTMLAttributes<HTMLTableCellElement>>) {
  return (
    <th
      scope="col"
      className="px-6 py-4 font-heading text-xs font-normal uppercase tracking-[0.12em] text-antique-gold"
      {...props}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: PropsWithChildren) {
  return <tbody className="divide-y divide-parchment/8">{children}</tbody>;
}

export function TableRow({ children }: PropsWithChildren) {
  return <tr className="transition-colors duration-200 hover:bg-graphite">{children}</tr>;
}

export function TableCell({
  children,
  className,
  ...props
}: PropsWithChildren<TdHTMLAttributes<HTMLTableCellElement>>) {
  return (
    <td className={`px-6 py-4 ${className ?? ""}`} {...props}>
      {children}
    </td>
  );
}
