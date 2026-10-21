import { TX_LABELS, acct, dateTime, money, signedMoney } from "../lib/format.js";

const ICONS = {
  deposit: "M12 19V5m0 0-6 6m6-6 6 6",
  coins: "M12 19V5m0 0-6 6m6-6 6 6",
  transfer_in: "M12 19V5m0 0-6 6m6-6 6 6",
  interest: "M4 17l6-6 4 4 6-8",
  withdrawal: "M12 5v14m0 0-6-6m6 6 6-6",
  atm: "M12 5v14m0 0-6-6m6 6 6-6",
  transfer_out: "M12 5v14m0 0-6-6m6 6 6-6",
};

function describe(tx) {
  if (tx.kind === "transfer_out") return `To •••• ${acct(tx.counterparty).slice(-4)}`;
  if (tx.kind === "transfer_in") return `From •••• ${acct(tx.counterparty).slice(-4)}`;
  if (tx.kind === "atm" && tx.details?.bills) {
    const b = tx.details.bills;
    return [b["20"] && `${b["20"]}×$20`, b["10"] && `${b["10"]}×$10`, b["5"] && `${b["5"]}×$5`].filter(Boolean).join(" · ");
  }
  if (tx.kind === "coins" && tx.details?.coins)
    return Object.entries(tx.details.coins).map(([c, n]) => `${n}${c}`).join(" ");
  return null;
}

export default function TransactionList({ transactions, showAccount = false }) {
  return (
    <ul className="divide-y divide-line">
      {transactions.map((tx) => {
        const positive = tx.amountCents > 0;
        const neutral = tx.amountCents === 0;
        const sub = describe(tx);
        const memo = tx.memo && tx.memo !== TX_LABELS[tx.kind] ? tx.memo : null;
        return (
          <li key={tx.id} className="flex items-center gap-4 py-3.5">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              neutral ? "bg-line/70 text-muted" : positive ? "bg-good/10 text-good" : "bg-copper-100 text-copper-600"}`}>
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS[tx.kind] || "M5 12h14"} />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{memo || TX_LABELS[tx.kind] || tx.kind}</p>
              <p className="truncate text-xs text-muted">
                {dateTime(tx.createdAt)}
                {showAccount && <> · •••• {String(tx.account).slice(-4)}</>}
                {sub && <> · {sub}</>}
              </p>
            </div>
            {!neutral && (
              <div className="text-right">
                <p className={`money text-sm font-medium ${positive ? "text-good" : "text-ink"}`}>{signedMoney(tx.amountCents)}</p>
                <p className="money text-[11px] text-muted">{money(tx.balanceAfterCents)}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
