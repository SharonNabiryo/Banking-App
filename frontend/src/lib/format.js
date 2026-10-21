const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const money = (cents) => usd.format((cents || 0) / 100);

export const signedMoney = (cents) =>
  cents > 0 ? `+${money(cents)}` : cents < 0 ? `−${money(-cents)}` : money(0);

export const acct = (n) => String(n).replace(/(\d{4})(\d{4})/, "$1 $2");

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const dateTime = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

export const TX_LABELS = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  atm: "ATM withdrawal",
  coins: "Coin deposit",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
  interest: "Interest",
  opened: "Account opened",
  closed: "Account closed",
  pin_change: "PIN changed",
};

// Mirrors CoinCollector.coin_values on the backend.
export const COINS = [
  { symbol: "P", name: "Penny", cents: 1 },
  { symbol: "N", name: "Nickel", cents: 5 },
  { symbol: "D", name: "Dime", cents: 10 },
  { symbol: "Q", name: "Quarter", cents: 25 },
  { symbol: "H", name: "Half dollar", cents: 50 },
  { symbol: "W", name: "Dollar", cents: 100 },
];

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
