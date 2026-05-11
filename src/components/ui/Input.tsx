import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string | null;
  helper?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, id, className, ...rest },
  ref
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn("input", error && "border-[color:var(--cp-error)]", className)}
        {...rest}
      />
      {error ? (
        <p className="input-error">{error}</p>
      ) : helper ? (
        <p className="mt-1 font-ui text-[12px] text-[color:var(--cp-mid)]">{helper}</p>
      ) : null}
    </div>
  );
});
