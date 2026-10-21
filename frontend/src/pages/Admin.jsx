import { useState } from "react";
import { Alert, Field, Spinner } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { acct, dateTime, money } from "../lib/format.js";
import { useAction, useApi } from "../lib/useApi.js";

export default function Admin() {
  const stats = useApi("/admin/stats");
  const [showClosed, setShowClosed] = useState(false);
  const accounts = useApi(`/admin/accounts${showClosed ? "?all=1" : ""}`);
  const [rate, setRate] = useState("");
  const [result, setResult] = useState(null);
  const { run, busy, error } = useAction();
  const s = stats.data;

  const applyInterest = (e) => {
    e.preventDefault();
    if (!window.confirm(`Apply one month of interest at ${rate}% APR to every open account?`)) return;
    run(async () => {
      setResult(await api("/admin/interest", { method: "POST", body: { annualRate: rate } }));
      setRate(""); stats.reload(); accounts.reload();
    });
  };

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-copper-600">Back office</p>
        <h1 className="font-display text-5xl sm:text-6xl">Bank admin</h1>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Deposits held" value={s && money(s.depositsCents)} />
        <Stat label="Customers" value={s?.customers} />
        <Stat label="Open accounts" value={s && `${s.openAccounts} / ${s.capacity}`} />
        <div className="panel p-5">
          <p className="text-xs text-muted">Capacity used</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-copper-500 transition-all" style={{ width: s ? `${(s.openAccounts / s.capacity) * 100}%` : 0 }} />
          </div>
        </div>
      </section>

      <section className="panel grid gap-6 p-6 sm:p-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl">Monthly interest</h2>
          <p className="mt-1 text-sm text-muted">Credits balance × (annual rate ÷ 12) to every open account, rounded to the cent.</p>
          <form onSubmit={applyInterest} className="mt-5 flex gap-2">
            <Field>
              <div className="relative">
                <input className="input money pr-10" type="number" step="0.01" min="0.01" max="25" placeholder="2.75" value={rate} onChange={(e) => setRate(e.target.value)} required />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">%</span>
              </div>
            </Field>
            <button className="btn-copper shrink-0" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}Apply</button>
          </form>
          <div className="mt-3"><Alert>{error}</Alert></div>
        </div>
        {result && (
          <div className="rounded-2xl bg-paper p-5 animate-rise">
            <p className="text-sm text-muted">Applied at {result.rate}% APR</p>
            <p className="money text-3xl font-medium text-good">+{money(result.totalCents)}</p>
            <p className="text-sm text-muted">across {result.accountsCredited} account{result.accountsCredited === 1 ? "" : "s"}</p>
            <ul className="mt-3 max-h-32 space-y-1 overflow-auto text-xs">
              {result.results.map((r) => (
                <li key={r.number} className="money flex justify-between"><span>{acct(r.number)}</span><span>+{money(r.interestCents)} → {money(r.balanceCents)}</span></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <h2 className="font-display text-3xl">All accounts</h2>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="accent-copper-500" /> Include closed
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-y border-line bg-paper/60 text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-6 py-3 font-medium">Account</th><th className="px-3 py-3 font-medium">Owner</th><th className="px-3 py-3 font-medium">SSN</th><th className="px-3 py-3 font-medium">Opened</th><th className="px-6 py-3 text-right font-medium">Balance</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {accounts.data?.accounts.map((a) => (
                <tr key={a.number} className={a.status !== "open" ? "text-muted" : ""}>
                  <td className="px-6 py-3"><p className="money">{acct(a.number)}</p><p className="text-xs capitalize text-muted">{a.kind}{a.status !== "open" && " · closed"}</p></td>
                  <td className="px-3 py-3"><p>{a.owner.firstName} {a.owner.lastName}</p><p className="text-xs text-muted">{a.owner.email}</p></td>
                  <td className="money px-3 py-3 text-xs">{a.owner.ssn}</td>
                  <td className="px-3 py-3 text-xs">{dateTime(a.createdAt)}</td>
                  <td className="money px-6 py-3 text-right">{money(a.balanceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="money mt-3 text-xl font-medium sm:text-2xl">{value ?? "—"}</p>
    </div>
  );
}
