import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-900 flex items-center justify-center px-4">
          <div className="card p-8 max-w-md text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
              An unexpected error occurred. Try reloading the page — if it keeps happening, please let us know.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
