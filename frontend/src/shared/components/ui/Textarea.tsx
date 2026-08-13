import type { TextareaHTMLAttributes } from "react";

function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-y rounded-input border border-graphite bg-midnight px-4 py-2 text-sm text-parchment placeholder:text-ash transition-colors duration-200 focus:border-antique-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-gold disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      {...props}
    />
  );
}

export default Textarea;
