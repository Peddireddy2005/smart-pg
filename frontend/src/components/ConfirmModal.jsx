export default function ConfirmModal({
  open,
  title = "Are you sure?",
  description = "",
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div className="card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-2">{title}</h3>
        {description && <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">{description}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button onClick={onConfirm} className={danger ? "btn-danger text-sm" : "btn-primary text-sm"}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
