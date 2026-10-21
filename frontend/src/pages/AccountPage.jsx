import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TransactionList from "../components/TransactionList.jsx";
import { Alert, EmptyState, Field, MoneyField, PinField, Spinner } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { COINS, acct, dateTime, money } from "../lib/format.js";
import { useAction, useApi } from "../lib/useApi.js";

const TABS = [
  ["deposit", "Deposit"],
  ["withdraw", "Withdraw"],
  ["atm", "ATM"],
  ["coins", "Coins"],
  ["settings", "Settings"],
];
const PAGE = 15;

export default function AccountPage() {
  const { number } = useParams();
  const [tab, setTab] = useState("deposit");
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useApi(`/accounts/${number}`);
  const history = useApi(`/accounts/${number}/transactions?limit=${PAGE}&offset=${page * PAGE}`);

  const refresh = () => { reload(); history.reload(); };

  if (loading && !data) return <Spinner className="h-6 w-6 text-copper-500" />;
  if (error) return <EmptyState title="Account not found"><Link to="/" className="btn-ghost mt-4">Back to overview</Link></EmptyState>;

  const a = data.account;
  const closed = a.status !== "open";
  const savings = a.kind === "savings";
  const total = history.data?.total || 0;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-muted hover:text-ink">← Overview</Link>

      <header className={`grain relative overflow-hidden rounded-[2rem] p-6 text-paper sm:p-10 animate-rise ${savings ? "bg-linear-to-br from-copper-500 to-copper-600" : "bg-linear-to-br from-forest-800 to-forest-950"}`}>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-copper-200/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-paper/60">{a.kind} · {acct(a.number)}</p>
            <h1 className="mt-2 font-display text-5xl">{a.nickname}</h1>
            <p className="mt-1 text-sm text-paper/60">{a.owner.firstName} {a.owner.lastName} · SSN {a.owner.ssn}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-paper/60">{closed ? "Closed" : "Available balance"}</p>
            <p className="money text-4xl font-medium sm:text-5xl">{money(a.balanceCents)}</p>
          </div>
        </div>
      </header>

      {closed ? (
        <Alert kind="info">This account was closed on {dateTime(a.closedAt)}. Its history is kept below.</Alert>
      ) : (
        <section className="panel overflow-hidden">
          <div className="flex gap-1 overflow-x-auto border-b border-line p-2" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${tab === id ? "bg-forest-900 text-paper" : "text-muted hover:bg-line/60 hover:text-ink"}`}>
                {label}
              </button>
            ))}
            <Link to={`/transfer?from=${a.number}`} className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-line/60 hover:text-ink">Transfer ↗</Link>
          </div>
          <div className="p-6 sm:p-8" key={tab}>
            {tab === "deposit" && <DepositForm account={a} onDone={refresh} />}
            {tab === "withdraw" && <WithdrawForm account={a} onDone={refresh} />}
            {tab === "atm" && <AtmForm account={a} onDone={refresh} />}
            {tab === "coins" && <CoinForm account={a} onDone={refresh} />}
            {tab === "settings" && <Settings account={a} onDone={refresh} />}
          </div>
        </section>
      )}

      <section className="panel p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-3xl">History</h2>
          <span className="text-xs text-muted">{total} entries</span>
        </div>
        {history.data && <TransactionList transactions={history.data.transactions} />}
        {total > PAGE && (
          <div className="mt-4 flex items-center justify-between">
            <button className="btn-ghost py-2" disabled={page === 0} onClick={() => setPage(page - 1)}>Newer</button>
            <span className="text-xs text-muted">Page {page + 1} of {Math.ceil(total / PAGE)}</span>
            <button className="btn-ghost py-2" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>Older</button>
          </div>
        )}
      </section>
    </div>
  );
}

function Form({ onSubmit, busy, error, success, cta, children, tone = "btn-primary" }) {
  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4 animate-fade">
      {children}
      <Alert>{error}</Alert>
      <Alert kind="success">{success}</Alert>
      <button className={`${tone} w-full`} disabled={busy}>{busy && <Spinner className="h-4 w-4" />}{cta}</button>
    </form>
  );
}

function DepositForm({ account, onDone }) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [success, setSuccess] = useState("");
  const { run, busy, error } = useAction();
  const submit = (e) => {
    e.preventDefault();
    setSuccess("");
    run(async () => {
      const r = await api(`/accounts/${account.number}/deposit`, { method: "POST", body: { amount, memo } });
      setSuccess(`Deposited ${money(r.transaction.amountCents)}. New balance: ${money(r.account.balanceCents)}.`);
      setAmount(""); setMemo(""); onDone();
    });
  };
  return (
    <Form onSubmit={submit} busy={busy} error={error} success={success} cta="Deposit" tone="btn-copper">
      <MoneyField value={amount} onChange={setAmount} hint="Dollars and cents, e.g. 2.57" />
      <Field label="Memo (optional)"><input className="input" maxLength={140} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Paycheck" /></Field>
    </Form>
  );
}

function WithdrawForm({ account, onDone }) {
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [success, setSuccess] = useState("");
  const { run, busy, error } = useAction();
  const submit = (e) => {
    e.preventDefault();
    setSuccess("");
    run(async () => {
      const r = await api(`/accounts/${account.number}/withdraw`, { method: "POST", body: { amount, pin } });
      setSuccess(`Withdrew ${money(-r.transaction.amountCents)}. New balance: ${money(r.account.balanceCents)}.`);
      setAmount(""); setPin(""); onDone();
    });
  };
  return (
    <Form onSubmit={submit} busy={busy} error={error} success={success} cta="Withdraw">
      <MoneyField value={amount} onChange={setAmount} hint={`Available: ${money(account.balanceCents)}`} />
      <PinField value={pin} onChange={setPin} />
    </Form>
  );
}

const QUICK = [20, 40, 60, 100, 200];

function AtmForm({ account, onDone }) {
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [bills, setBills] = useState(null);
  const { run, busy, error } = useAction();
  const submit = (e) => {
    e.preventDefault();
    setBills(null);
    run(async () => {
      const r = await api(`/accounts/${account.number}/atm`, { method: "POST", body: { amount, pin } });
      setBills({ ...r.bills, total: -r.transaction.amountCents, balance: r.account.balanceCents });
      setPin(""); onDone();
    });
  };
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Form onSubmit={submit} busy={busy} error={error} cta="Dispense cash">
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button type="button" key={q} onClick={() => setAmount(String(q))}
              className={`money rounded-full border px-4 py-2 text-sm transition ${Number(amount) === q ? "border-copper-500 bg-copper-100" : "border-line hover:border-copper-400"}`}>
              ${q}
            </button>
          ))}
        </div>
        <MoneyField value={amount} onChange={setAmount} step="5" min="5" max="1000" label="Or enter an amount"
          hint="$5 – $1,000, in multiples of $5. Paid in $20, $10 and $5 bills." />
        <PinField value={pin} onChange={setPin} />
      </Form>
      <div className="rounded-3xl bg-paper p-6">
        {bills ? (
          <div className="animate-rise">
            <p className="text-sm text-muted">Please take your cash</p>
            <p className="money text-3xl font-medium">{money(bills.total)}</p>
            <div className="mt-6 space-y-3">
              {["20", "10", "5"].map((d) => <BillRow key={d} denom={d} count={bills[d]} />)}
            </div>
            <p className="mt-6 text-sm text-muted">New balance <span className="money text-ink">{money(bills.balance)}</span></p>
          </div>
        ) : (
          <div className="grid h-full min-h-48 place-items-center text-center text-sm text-muted">
            <div><div className="mx-auto mb-3 h-2 w-32 rounded-full bg-forest-900/80" />The cash slot is waiting.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BillRow({ denom, count }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-10 w-20">
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <div key={i} className="absolute grid h-10 w-20 place-items-center rounded-md border border-forest-700/40 bg-linear-to-br from-[#d9e6d2] to-[#b7cdb0] font-display text-lg text-forest-900 shadow-sm"
            style={{ transform: `translate(${i * 4}px, ${-i * 3}px)`, animation: `rise .4s ${i * 0.08}s both` }}>
            ${denom}
          </div>
        ))}
        {!count && <div className="grid h-10 w-20 place-items-center rounded-md border border-dashed border-line text-xs text-muted">${denom}</div>}
      </div>
      <p className="money ml-auto text-sm"><span className="text-xl font-medium">{count}</span> × ${denom}</p>
    </div>
  );
}

function CoinForm({ account, onDone }) {
  const [coins, setCoins] = useState("");
  const [success, setSuccess] = useState("");
  const { run, busy, error } = useAction();
  const preview = [...coins.toUpperCase()].reduce((t, c) => t + (COINS.find((x) => x.symbol === c)?.cents || 0), 0);
  const invalid = [...coins].filter((c) => c.trim() && c !== "," && !COINS.some((x) => x.symbol === c.toUpperCase()));

  const submit = (e) => {
    e.preventDefault();
    setSuccess("");
    run(async () => {
      const r = await api(`/accounts/${account.number}/coins`, { method: "POST", body: { coins } });
      const skipped = r.invalid.length ? ` Skipped invalid: ${r.invalid.join(", ")}.` : "";
      setSuccess(`${money(r.transaction.amountCents)} deposited into account.${skipped}`);
      setCoins(""); onDone();
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Form onSubmit={submit} busy={busy} error={error} success={success} cta={`Deposit ${money(preview)}`} tone="btn-copper">
        <Field label="Coins" hint="Tap a coin or type its letter: P N D Q H W">
          <input className="input money text-lg uppercase tracking-widest" value={coins} onChange={(e) => setCoins(e.target.value)} placeholder="QQDNP" required />
        </Field>
        {invalid.length > 0 && <Alert kind="info">Invalid coin character{invalid.length > 1 ? "s" : ""}: {invalid.join(", ")} — will be ignored.</Alert>}
      </Form>
      <div className="grid grid-cols-3 gap-3 self-start">
        {COINS.map((c) => (
          <button key={c.symbol} type="button" onClick={() => setCoins(coins + c.symbol)}
            className="group flex flex-col items-center rounded-2xl border border-line bg-paper p-3 transition hover:border-copper-400 active:scale-95">
            <span className={`grid h-12 w-12 place-items-center rounded-full font-display text-xl shadow-inner transition group-hover:-rotate-12 ${
              c.symbol === "P" ? "bg-linear-to-br from-copper-400 to-copper-600 text-white" : c.symbol === "W" ? "bg-linear-to-br from-[#e8c66a] to-[#b8902f] text-forest-900" : "bg-linear-to-br from-[#e4e1da] to-[#a9a59c] text-forest-900"}`}>
              {c.symbol}
            </span>
            <span className="mt-2 text-xs font-medium">{c.name}</span>
            <span className="money text-[11px] text-muted">{money(c.cents)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Settings({ account, onDone }) {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ChangePin account={account} />
      <div className="space-y-10">
        <Rename account={account} onDone={onDone} />
        <CloseAccount account={account} />
      </div>
    </div>
  );
}

function ChangePin({ account }) {
  const [f, setF] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [success, setSuccess] = useState("");
  const { run, busy, error } = useAction();
  const submit = (e) => {
    e.preventDefault();
    setSuccess("");
    run(async () => {
      await api(`/accounts/${account.number}/pin`, { method: "PUT", body: f });
      setSuccess("PIN updated.");
      setF({ currentPin: "", newPin: "", confirmPin: "" });
    });
  };
  return (
    <div>
      <h3 className="mb-4 font-display text-2xl">Change PIN</h3>
      <Form onSubmit={submit} busy={busy} error={error} success={success} cta="Update PIN">
        <PinField label="Current PIN" value={f.currentPin} onChange={(v) => setF({ ...f, currentPin: v })} />
        <div className="grid grid-cols-2 gap-3">
          <PinField label="New PIN" value={f.newPin} onChange={(v) => setF({ ...f, newPin: v })} />
          <PinField label="Confirm" value={f.confirmPin} onChange={(v) => setF({ ...f, confirmPin: v })} />
        </div>
      </Form>
    </div>
  );
}

function Rename({ account, onDone }) {
  const [nickname, setNickname] = useState(account.nickname);
  const { run, busy, error } = useAction();
  const submit = (e) => {
    e.preventDefault();
    run(async () => { await api(`/accounts/${account.number}`, { method: "PATCH", body: { nickname } }); onDone(); });
  };
  return (
    <div>
      <h3 className="mb-4 font-display text-2xl">Nickname</h3>
      <form onSubmit={submit} className="flex max-w-md gap-2">
        <input className="input" maxLength={60} value={nickname} onChange={(e) => setNickname(e.target.value)} required />
        <button className="btn-ghost shrink-0" disabled={busy || nickname === account.nickname}>Save</button>
      </form>
      <div className="mt-2 max-w-md"><Alert>{error}</Alert></div>
    </div>
  );
}

function CloseAccount({ account }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState(false);
  const { run, busy, error } = useAction();
  const navigate = useNavigate();
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      await api(`/accounts/${account.number}/close`, { method: "POST", body: { pin } });
      navigate("/");
    });
  };
  return (
    <div>
      <h3 className="mb-1 font-display text-2xl text-bad">Close account</h3>
      <p className="mb-4 max-w-md text-sm text-muted">The balance must be $0.00 first — withdraw or transfer what's left. History is kept.</p>
      {!confirm ? (
        <button className="btn-ghost text-bad" onClick={() => setConfirm(true)}>Close this account…</button>
      ) : (
        <Form onSubmit={submit} busy={busy} error={error} cta={`Close •••• ${String(account.number).slice(-4)}`} tone="btn-danger">
          <PinField value={pin} onChange={setPin} autoFocus />
        </Form>
      )}
    </div>
  );
}
