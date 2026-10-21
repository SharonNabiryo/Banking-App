import { useEffect, useRef } from "react";

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  const styles = {
    error: "border-bad/30 bg-bad/8 text-bad",
    success: "border-good/30 bg-good/8 text-good",
    info: "border-copper-400/40 bg-copper-100/60 text-copper-600",
  };
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`animate-fade rounded-2xl border px-4 py-3 text-sm ${styles[kind]}`}>
      {children}
    </div>
  );
}

export function PinField({ value, onChange, label = "PIN", autoFocus }) {
  return (
    <Field label={label}>
      <input
        className="input money text-center text-xl tracking-[0.6em]"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder="••••"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        required
      />
    </Field>
  );
}

export function MoneyField({ value, onChange, label = "Amount", hint, step = "0.01", min = "0.01", max, required = true }) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <span className="money pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
        <input
          className="input money pl-8 text-lg"
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </Field>
  );
}

export function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-forest-950/50 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="animate-rise p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className="font-display text-3xl">{title}</h2>
            <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-line/60" aria-label="Close">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-2xl">{title}</p>
      <div className="mt-2 text-sm text-muted">{children}</div>
    </div>
  );
}
