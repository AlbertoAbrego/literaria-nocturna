import type { InputHTMLAttributes } from "react";

function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-input border border-graphite bg-midnight px-4 py-2 text-sm text-parchment placeholder:text-ash transition-colors duration-200 focus:border-antique-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-gold disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      {...props}
    />
  );
}

export default Input;
