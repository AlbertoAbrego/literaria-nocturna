import { cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

type FormControlProps = {
  id?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  disabled?: boolean;
};

function FormField({ id, label, error, required, disabled, children }: FormFieldProps) {
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<FormControlProps>, {
        id,
        "aria-required": required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? `${id}-error` : undefined,
        disabled,
      })
    : children;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-parchment">
        {label}
      </label>
      {control}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
