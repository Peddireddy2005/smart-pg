import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-heading font-extrabold text-brand-500 mb-2">404</p>
        <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}