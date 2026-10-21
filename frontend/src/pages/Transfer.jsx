import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, EmptyState, Field, MoneyField, PinField, Spinner } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { acct, money } from "../lib/format.js";
import { useAction, useApi } from "../lib/useApi.js";

export default function Transfer() {
  const [params] = useSearchParams();
  const { data, reload } = useApi("/accounts");
  const accounts = data?.accounts || [];
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [pin, setPin] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [done, setDone] = useState(null);
  const { run, busy, error, setError } = useAction();

  useEffect(() => {
    if (!from && accounts.length) setFrom(String(accounts[0].number));
  }, [accounts, from]);

  // Look up who owns the destination account once all 8 digits are in.
  useEffect(() => {
    setRecipient(null);
    const digits = to.replace(/\D/g, "");
    if (digits.length !== 8) return;
    const t = setTimeout(() => {
      api(`/recipients/${digits}`).then(setRecipient).catch((e) => setRecipient({ error: e.message }));
    }, 250);
    return () => clearTimeout(t);
  }, [to]);

  const source = accounts.find((a) => String(a.number) === String(from));

  const submit = (e) => {
    e.preventDefault();
    if (recipient?.error) return setError(recipient.error);
    run(async () => {
      const r = await api("/transfers", { method: "POST", body: { from, to: to.replace(/\D/g, ""), amount, pin, memo } });
      setDone({ ...r, name: recipient?.name });
      setAmount(""); setPin(""); setMemo("");
      reload();
    });
  };

  if (data && !accounts.length)
    return <EmptyState title="Open an account first"><Link to="/" className="btn-copper mt-4">Go to overview</Link></EmptyState>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-5xl sm:text-6xl">Transfer</h1>
        <p className="mt-1 text-muted">Move money between your accounts or to another Copperleaf member.</p>
      </header>

      {done ? (
        <div className="panel animate-rise p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-good/10 text-good">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 13 4 4L19 7" /></svg>
          </div>
          <h2 className="mt-4 font-display text-4xl">Transfer complete</h2>
          <p className="money mt-2 text-3xl">{money(-done.transaction.amountCents)}</p>
          <p className="mt-2 text-sm text-muted">to {done.name} · {acct(done.to.number)}</p>
          <div className="mx-auto mt-6 max-w-xs space-y-1 text-sm">
            <p className="flex justify-between"><span className="text-muted">New balance in {acct(done.from.number)}</span><span className="money">{money(done.from.balanceCents)}</span></p>
            {done.to.balanceCents != null && (
              <p className="flex justify-between"><span className="text-muted">New balance in {acct(done.to.number)}</span><span className="money">{money(done.to.balanceCents)}</span></p>
            )}
          </div>
          <button className="btn-primary mt-8" onClick={() => { setDone(null); setTo(""); }}>Make another transfer</button>
        </div>
      ) : (
        <form onSubmit={submit} className="panel space-y-5 p-6 sm:p-8 animate-rise">
          <Field label="From">
            <select className="input" value={from} onChange={(e) => setFrom(e.target.value)} required>
              {accounts.map((a) => (
                <option key={a.number} value={a.number}>{a.nickname} · {acct(a.number)} · {money(a.balanceCents)}</option>
              ))}
            </select>
          </Field>

          <div>
            <Field label="To account number">
              <input className="input money tracking-widest" inputMode="numeric" maxLength={9} placeholder="1234 5678" required
                value={to} onChange={(e) => setTo(e.target.value.replace(/[^\d ]/g, ""))} />
            </Field>
            {accounts.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {accounts.filter((a) => String(a.number) !== String(from)).map((a) => (
                  <button type="button" key={a.number} onClick={() => setTo(String(a.number))}
                    className="rounded-full border border-line px-3 py-1 text-xs hover:border-copper-400">
                    {a.nickname} · {String(a.number).slice(-4)}
                  </button>
                ))}
              </div>
            )}
            {recipient && (
              <p className={`mt-2 text-sm ${recipient.error ? "text-bad" : "text-good"}`}>
                {recipient.error || <>✓ {recipient.name}{recipient.own && " (your account)"}</>}
              </p>
            )}
          </div>

          <MoneyField value={amount} onChange={setAmount} hint={source && `Available: ${money(source.balanceCents)}`} />
          <Field label="Memo (optional)"><input className="input" maxLength={140} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Rent, dinner…" /></Field>
          <PinField label="PIN for the sending account" value={pin} onChange={setPin} />
          <Alert>{error}</Alert>
          <button className="btn-copper w-full py-3.5" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}Send transfer</button>
        </form>
      )}
    </div>
  );
}
