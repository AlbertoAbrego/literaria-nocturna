import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-antique-gold text-obsidian hover:bg-burnished-gold",
  secondary: "border border-graphite text-parchment hover:bg-charcoal",
  ghost: "text-fog hover:bg-midnight",
};

function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-button px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-gold disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}

export default Button;
