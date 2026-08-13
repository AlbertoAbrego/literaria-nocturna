import type { SelectHTMLAttributes } from "react";

function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full cursor-pointer appearance-none rounded-input border border-graphite bg-midnight px-4 py-2 text-sm text-parchment transition-colors duration-200 focus:border-antique-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-gold disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      {children}
    </select>
  );
}

export default Select;
