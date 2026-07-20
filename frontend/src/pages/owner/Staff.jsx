import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { createStaff, getOwnerStaff, updateStaff, deleteStaff, markAttendance } from "../../services/staffService";
import ConfirmModal from "../../components/ConfirmModal";

const ROLES = ["Cleaner", "Cook", "Security", "Electrician", "Plumber", "Other"];

export default function Staff() {
  const [pgs, setPgs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ pgId: "", name: "", role: "Cleaner", phone: "", salary: "" });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/pg/owner"), getOwnerStaff()])
      .then(([p, s]) => { setPgs(p.data); setStaff(s); if (p.data[0]) setForm((f) => ({ ...f, pgId: p.data[0]._id })); })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const created = await createStaff(form.pgId, { name: form.name, role: form.role, phone: form.phone, salary: Number(form.salary) || 0 });
      const pg = pgs.find((p) => p._id === form.pgId);
      setStaff((prev) => [{ ...created, pg }, ...prev]);
      setForm({ ...form, name: "", phone: "", salary: "" });
      toast.success("Staff added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setAdding(false);
    }
  };

  const toggleToday = async (s) => {
    const todayEntry = s.attendance.find((a) => new Date(a.date).toDateString() === new Date().toDateString());
    const nextPresent = !todayEntry || !todayEntry.present;
    try {
      const updated = await markAttendance(s._id, nextPresent);
      setStaff((prev) => prev.map((x) => (x._id === s._id ? { ...x, attendance: updated.attendance } : x)));
    } catch {
      toast.error("Failed to mark attendance");
    }
  };

  const toggleActive = async (s) => {
    try {
      const updated = await updateStaff(s._id, { isActive: !s.isActive });
      setStaff((prev) => prev.map((x) => (x._id === s._id ? { ...x, isActive: updated.isActive } : x)));
    } catch {
      toast.error("Failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteStaff(deleting);
      setStaff((prev) => prev.filter((s) => s._id !== deleting));
      toast.success("Staff removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeleting(null);
    }
  };

  const isPresentToday = (s) => {
    const entry = s.attendance.find((a) => new Date(a.date).toDateString() === new Date().toDateString());
    return entry ? entry.present : null;
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Staff Management</h1>

      <form onSubmit={submit} className="card p-6 mb-8 space-y-4">
        <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Add Staff Member</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">PG</label>
            <select className="input" value={form.pgId} onChange={(e) => setForm({ ...form, pgId: e.target.value })}>
              {pgs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Monthly Salary (₹)</label>
            <input className="input" type="number" min={0} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </div>
        </div>
        <button disabled={adding || !pgs.length} className="btn-primary">{adding ? "Adding..." : "+ Add Staff"}</button>
      </form>

      {loading ? <p className="text-slate-400">Loading...</p> : staff.length === 0 ? (
        <p className="text-slate-400">No staff added yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {staff.map((s) => (
            <div key={s._id} className={`card p-5 ${!s.isActive ? "opacity-60" : ""}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-heading font-bold text-slate-900 dark:text-white">{s.name}</p>
                  <span className="badge-blue">{s.role}</span>
                </div>
                <span className={isPresentToday(s) === false ? "badge-red" : isPresentToday(s) ? "badge-green" : "badge-gray"}>
                  {isPresentToday(s) === false ? "Absent Today" : isPresentToday(s) ? "Present Today" : "Not Marked"}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.phone || "No phone"} · {s.pg?.name}</p>
              {s.salary > 0 && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">₹{s.salary.toLocaleString()}/mo</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => toggleToday(s)} className="btn-secondary text-xs">Mark {isPresentToday(s) ? "Absent" : "Present"}</button>
                <button onClick={() => toggleActive(s)} className="btn-secondary text-xs">{s.isActive ? "Deactivate" : "Activate"}</button>
                <button onClick={() => setDeleting(s._id)} className="btn-danger text-xs">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={!!deleting} title="Remove this staff member?" confirmLabel="Remove" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
