export default function EmptyState({ icon = "📭", title, subtitle, action }) {
  return (
    <div className="card p-12 text-center text-slate-400">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="font-heading font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}