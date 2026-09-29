import React from "react";
import { captureEvent } from "@/services/analyticsService";
import { Warning, ArrowClockwise, House, Bug, CaretDown, CaretUp } from "@phosphor-icons/react";

/**
 * Global React Error Boundary component for Trexio Outdoor Marketplace.
 * Catches unhandled JavaScript runtime errors in child component trees,
 * reports exception details to PostHog analytics, and renders a graceful,
 * user-friendly recovery UI.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Console logging for local debugging
    console.error("[Global ErrorBoundary Caught Exception]:", error, errorInfo);

    // Track error event in PostHog analytics for production monitoring
    captureEvent("app_runtime_error", {
      error_name: error?.name || "UnhandledError",
      error_message: error?.message || String(error),
      error_stack: error?.stack || "",
      component_stack: errorInfo?.componentStack || "",
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if passed via props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || "Terjadi kesalahan sistem yang tidak diharapkan.";
      const errorStack = this.state.error?.stack || "";
      const componentStack = this.state.errorInfo?.componentStack || "";

      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6">
            
            {/* Header Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5">
              <Warning size={36} weight="duotone" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Aduh! Terjadi Kendala Teknis
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Aplikasi mengalami kesalahan yang tidak terduga. Jangan khawatir, data dan reservasi Anda tetap aman. Silakan muat ulang halaman atau kembali ke beranda.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-95"
              >
                <ArrowClockwise size={18} weight="bold" />
                Coba Muat Ulang
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground font-semibold text-sm transition-all active:scale-95"
              >
                <House size={18} weight="bold" />
                Ke Beranda
              </button>
            </div>

            {/* Collapsible Technical Details for Debugging */}
            <div className="pt-4 border-t border-border/60">
              <button
                onClick={this.toggleDetails}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                <Bug size={14} />
                <span>{this.state.showDetails ? "Sembunyikan Detail Error" : "Lihat Detail Error (Teknis)"}</span>
                {this.state.showDetails ? <CaretUp size={12} /> : <CaretDown size={12} />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 text-left bg-muted/70 p-3.5 rounded-xl text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-48 border border-border/40 space-y-2">
                  <p className="font-bold text-destructive break-words">{errorMessage}</p>
                  {errorStack && (
                    <details className="cursor-pointer">
                      <summary className="font-semibold text-foreground/80">Stack Trace</summary>

                      <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] text-muted-foreground/80">
                        {errorStack}
                      </pre>
                    </details>
                  )}
                  {componentStack && (
                    <details className="cursor-pointer">
                      <summary className="font-semibold text-foreground/80">Component Stack</summary>

                      <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] text-muted-foreground/80">
                        {componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
