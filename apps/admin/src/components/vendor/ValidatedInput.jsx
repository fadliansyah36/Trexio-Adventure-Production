import { useState } from "react";
import { CheckCircle, XCircle, WarningCircle, Check } from "@phosphor-icons/react";

export function ValidatedInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  validator,
  helperText,
  minLength,
  maxLength,
  pattern,
  inputMode,
  icon: LeftIcon,
  testid,
  disabled = false,
  className = "",
  rows,
  isTextArea = false,
  options,
  isSelect = false,
  successMessage,
  errorMessage,
}) {
  const [touched, setTouched] = useState(false);

  const rawVal = value !== undefined && value !== null ? String(value) : "";
  const valTrim = rawVal.trim();

  let isValid = true;
  let computedMsg = "";

  if (valTrim.length === 0) {
    if (required && touched) {
      isValid = false;
      computedMsg = errorMessage || "Wajib diisi";
    } else {
      isValid = !required;
      computedMsg = helperText || "";
    }
  } else {
    if (validator) {
      const res = validator(rawVal);
      isValid = res.isValid;
      computedMsg = res.message;
    } else if (minLength && valTrim.length < minLength) {
      isValid = false;
      computedMsg = errorMessage || `Minimal ${minLength} karakter`;
    } else if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valTrim)) {
      isValid = false;
      computedMsg = errorMessage || "Format email tidak valid (contoh: nama@domain.com)";
    } else if (type === "tel" && valTrim.replace(/\D/g, "").length < 9) {
      isValid = false;
      computedMsg = errorMessage || "Nomor HP minimal 9 digit angka";
    } else {
      isValid = true;
      computedMsg = successMessage || "Data valid & tersimpan";
    }
  }

  const isFilled = valTrim.length > 0;
  const showError = (touched || isFilled) && !isValid;
  const showSuccess = isFilled && isValid;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label className="font-semibold text-xs text-foreground block tracking-tight">
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </label>

          {showSuccess && (
            <span
              data-testid={testid ? `${testid}-status-success` : undefined}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-in fade-in duration-200"
            >
              <CheckCircle size={12} weight="fill" className="text-emerald-500 shrink-0" />
              <span>Tersimpan</span>
            </span>
          )}

          {showError && (
            <span
              data-testid={testid ? `${testid}-status-error` : undefined}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 animate-in fade-in duration-200"
            >
              <XCircle size={12} weight="fill" className="text-rose-500 shrink-0" />
              <span>Error Input</span>
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
            <LeftIcon size={16} />
          </div>
        )}

        {isSelect ? (
          <select
            data-testid={testid}
            value={value}
            disabled={disabled}
            onBlur={() => setTouched(true)}
            onChange={(e) => {
              if (!touched) setTouched(true);
              onChange(e.target.value);
            }}
            className={`w-full h-10 rounded-xl border bg-background px-3 text-xs font-semibold transition-all outline-none appearance-none ${
              LeftIcon ? "pl-9" : ""
            } ${showSuccess || showError ? "pr-9" : "pr-8"} ${
              showError
                ? "border-rose-500 focus:border-rose-600 ring-2 ring-rose-500/20 bg-rose-500/[0.03] text-rose-900 dark:text-rose-100"
                : showSuccess
                ? "border-emerald-500 focus:border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-500/[0.03]"
                : "border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            }`}
          >
            {options?.map((opt) => (
              <option key={opt.value || opt.key} value={opt.value || opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : isTextArea ? (
          <textarea
            data-testid={testid}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows || 3}
            onBlur={() => setTouched(true)}
            onChange={(e) => {
              if (!touched) setTouched(true);
              onChange(e.target.value);
            }}
            className={`w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-medium transition-all outline-none ${
              LeftIcon ? "pl-9" : ""
            } ${
              showError
                ? "border-rose-500 focus:border-rose-600 ring-2 ring-rose-500/20 bg-rose-500/[0.03] text-rose-900 dark:text-rose-100"
                : showSuccess
                ? "border-emerald-500 focus:border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-500/[0.03]"
                : "border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            }`}
          />
        ) : (
          <input
            data-testid={testid}
            type={type}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            inputMode={inputMode}
            pattern={pattern}
            minLength={minLength}
            maxLength={maxLength}
            onBlur={() => setTouched(true)}
            onChange={(e) => {
              if (!touched) setTouched(true);
              onChange(e.target.value);
            }}
            className={`w-full h-10 rounded-xl border bg-background px-3 text-xs font-medium transition-all outline-none ${
              LeftIcon ? "pl-9" : ""
            } ${showSuccess || showError ? "pr-9" : ""} ${
              showError
                ? "border-rose-500 focus:border-rose-600 ring-2 ring-rose-500/20 bg-rose-500/[0.03] text-rose-900 dark:text-rose-100 font-semibold"
                : showSuccess
                ? "border-emerald-500 focus:border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-500/[0.03] font-semibold"
                : "border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            }`}
          />
        )}

        {/* Status Indicator Icon */}
        {!isTextArea && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 z-10">
            {showSuccess && (
              <CheckCircle size={18} weight="fill" className="text-emerald-500 animate-in zoom-in duration-150" />
            )}
            {showError && (
              <WarningCircle size={18} weight="fill" className="text-rose-500 animate-in zoom-in duration-150" />
            )}
          </div>
        )}
      </div>

      {/* Message Feedback Below */}
      {showError && (
        <p
          data-testid={testid ? `${testid}-error-text` : undefined}
          className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 pt-0.5 animate-in slide-in-from-top-1 duration-150"
        >
          <WarningCircle size={13} weight="fill" className="shrink-0 text-rose-500" />
          <span>{computedMsg || "Input tidak valid"}</span>
        </p>
      )}

      {showSuccess && (
        <p
          data-testid={testid ? `${testid}-success-text` : undefined}
          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5 animate-in slide-in-from-top-1 duration-150"
        >
          <Check size={12} weight="bold" className="shrink-0 text-emerald-500" />
          <span>{computedMsg || "Data tersimpan & memenuhi kriteria"}</span>
        </p>
      )}

      {!showError && !showSuccess && helperText && (
        <p className="text-[10px] text-muted-foreground pt-0.5">{helperText}</p>
      )}
    </div>
  );
}

export function FormCompletionBanner({ validCount, totalCount, label = "Kelengkapan Formulir Registrasi" }) {
  const pct = Math.round((validCount / Math.max(1, totalCount)) * 100);
  const isComplete = pct === 100;

  return (
    <div
      data-testid="form-completion-banner"
      className={`p-3.5 rounded-xl border transition-all ${
        isComplete
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
          : "border-border bg-card text-foreground"
      }`}
    >
      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
        <span className="flex items-center gap-1.5">
          {isComplete ? (
            <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          {label}
        </span>
        <span className={isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
          {validCount} dari {totalCount} Field Valid ({pct}%)
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isComplete ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
