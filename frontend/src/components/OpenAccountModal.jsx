import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { acct } from "../lib/format.js";
import { useAction } from "../lib/useApi.js";
import { Alert, Field, Modal, MoneyField, Spinner } from "./ui.jsx";

export default function OpenAccountModal({ open, onClose, onOpened }) {
  const [form, setForm] = useState({ kind: "checking", nickname: "", openingDeposit: "" });
  const [created, setCreated] = useState(null);
  const { run, busy, error, setError } = useAction();
  const navigate = useNavigate();

  const close = () => {
    onClose();
    setTimeout(() => { setCreated(null); setError(""); setForm({ kind: "checking", nickname: "", openingDeposit: "" }); }, 200);
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api("/accounts", { method: "POST", body: form });
      setCreated(res);
      onOpened?.();
    });
  };

  return (
    <Modal open={open} onClose={close} title={created ? "Account ready" : "Open an account"}>
      {created ? (
        <div className="space-y-5">
          <div className="grain relative rounded-3xl bg-forest-900 p-6 text-paper">
            <p className="text-xs uppercase tracking-[0.2em] text-paper/60">Account number</p>
            <p className="money mt-1 text-2xl">{acct(created.account.number)}</p>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-paper/60">Your PIN</p>
            <p className="money mt-1 text-5xl tracking-[0.3em] text-copper-400">{created.pin}</p>
          </div>
          <Alert kind="info">Write this PIN down — it's only shown once. You'll need it to withdraw, transfer or close the account. You can change it later.</Alert>
          <button className="btn-primary w-full" onClick={() => { close(); navigate(`/accounts/${created.account.number}`); }}>
            Go to account
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {["checking", "savings"].map((k) => (
              <button type="button" key={k} onClick={() => setForm({ ...form, kind: k })}
                className={`rounded-2xl border p-4 text-left transition ${form.kind === k ? "border-copper-500 bg-copper-100/50 ring-4 ring-copper-200/50" : "border-line hover:border-copper-400"}`}>
                <span className="font-display text-2xl capitalize">{k}</span>
                <span className="mt-1 block text-xs text-muted">{k === "checking" ? "For everyday spending" : "Earns monthly interest"}</span>
              </button>
            ))}
          </div>
          <Field label="Nickname (optional)">
            <input className="input" maxLength={60} value={form.nickname} placeholder={form.kind === "checking" ? "Everyday" : "Rainy day fund"}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          </Field>
          <MoneyField label="Opening deposit (optional)" value={form.openingDeposit} onChange={(v) => setForm({ ...form, openingDeposit: v })} min="0" required={false} />
          <Alert>{error}</Alert>
          <button className="btn-copper w-full" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}Open account</button>
        </form>
      )}
    </Modal>
  );
}
