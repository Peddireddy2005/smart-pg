import { Component } from "react";
import { TriangleAlert } from "lucide-react";

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
        <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
          <div className="card p-8 max-w-md text-center">
            <TriangleAlert size={32} className="mx-auto text-amber-500 mb-3" strokeWidth={1.75} />
            <h1 className="font-heading text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 text-sm mb-5">
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