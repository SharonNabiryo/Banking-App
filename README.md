# Copperleaf — Banking Management System

A banking application that simulates everyday banking: opening accounts, deposits, withdrawals, transfers, ATM withdrawals, coin deposits, monthly interest and account management.

It started as a Python command-line program for the **Foundations of Programming final project (CSC6003)**. It is now also a full-stack web app, with a **React + Tailwind** frontend, a **Flask REST API**, and an **SQL database** through SQLAlchemy. The web app keeps the rules from the original Python classes.

> **Disclaimer:** This is an educational banking simulation. It is not meant for real money. Use fictional customer information and test data only. SSNs must start with `999`, a range that is never issued to real people.

---

## Screens

| | |
|---|---|
| **Splash**: a copper coin flips in and the wordmark spells out. It shows once per browser session; tap to skip. | **Sign in / Register**: a split-screen welcome page. |
| **Overview**: total balance, a 30-day balance chart, money in and out, account cards and recent activity. | **Account**: tabs for Deposit, Withdraw, ATM (shows the bills you get), Coins (tap-to-add coin jar) and Settings (change PIN, rename, close). The transaction history is paginated. |
| **Transfer**: send to your own accounts or another member's. The app shows the recipient's name before you send. | **Bank admin**: bank stats, every account (CLI option 11) and monthly interest (CLI option 10). |

The app works on phones and desktops. On phones the sidebar becomes a floating bottom bar.

**Typography:** *Instrument Serif* for headings, *Bricolage Grotesque* for the interface and *Martian Mono* for money and account numbers. All three are self-hosted through Fontsource, so they work offline.

---

## Features

### Account management
- Register and sign in with an email and password. Passwords are hashed and sessions use JWT.
- Open **checking** or **savings** accounts, each with a unique **eight-digit account number** and a **four-digit PIN**. The PIN is shown only once.
- View account details and balance, rename an account, change the PIN (enter the new PIN twice to confirm) and close an account.
- The bank holds **at most 100 open accounts**. You can change this with `MAX_ACCOUNTS`.

### Banking transactions
- Deposit, withdraw and transfer money, with insufficient-funds checks.
- Transfers can go to any open account. The sender's PIN is required.
- Every transaction is saved with the balance after it, a memo, and the other account involved. You can filter and page through the history.

### ATM withdrawal
- Withdraw **$5 to $1,000** in **multiples of $5**.
- See how many **$20, $10 and $5 bills** the ATM pays out.

### Coin deposits

| Symbol | Coin | Value |
|---|---|---|
| P | Penny | $0.01 |
| N | Nickel | $0.05 |
| D | Dime | $0.10 |
| Q | Quarter | $0.25 |
| H | Half Dollar | $0.50 |
| W | Dollar | $1.00 |

The app adds up the coins and lists any invalid characters.

### Monthly interest
- An admin enters an annual rate. Each open account gets `balance × rate ÷ 12`, rounded to the cent, and the credit is recorded as an interest transaction.

### Validation and security
- Money is stored as **integer cents**. Amounts are read with `Decimal`, so float rounding errors can't creep in, and an amount can't have more than two decimal places.
- PINs and passwords are hashed with Werkzeug's `generate_password_hash`.
- **PIN lockout:** after 5 wrong PINs, the account is locked for 15 minutes.
- **No duplicate SSNs:** each SSN is stored as a keyed HMAC plus its last four digits. The full SSN is never saved.
- You can only act on your own accounts. Admin-only endpoints are protected.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite |
| Styling | Tailwind CSS v4 |
| Backend | Python, Flask |
| Database | SQLite by default, PostgreSQL through `DATABASE_URL` |
| ORM | SQLAlchemy 2 (Flask-SQLAlchemy) |
| Authentication | JWT (Flask-JWT-Extended) and password hashing |
| API | REST and JSON |
| Tests | pytest, run on GitHub Actions |

---

## Project structure

```text
Banking-App/
├── Account.py            # original CLI classes
├── Bank.py
├── BankManager.py        # run this for the command-line version
├── BankUtility.py
├── CoinCollector.py
├── Dockerfile            # production image: React build + Flask/gunicorn
├── render.yaml           # Render Blueprint (web service + PostgreSQL)
│
├── backend/
│   ├── app/
│   │   ├── __init__.py   # app factory, error handlers, serves the built React app
│   │   ├── banking.py    # pure banking rules ported from the CLI classes
│   │   ├── services.py   # database operations (the web version of Bank and BankManager)
│   │   ├── models.py     # User, Account, Transaction
│   │   ├── routes/       # auth.py, accounts.py, admin.py
│   │   ├── cli.py        # `flask seed`, `flask make-admin`
│   │   └── config.py
│   ├── tests/            # pytest suite
│   ├── requirements.txt
│   └── wsgi.py
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Splash, Layout, AccountCard, BalanceChart, ...
│   │   ├── pages/        # AuthPage, Dashboard, AccountPage, Transfer, Activity, Admin
│   │   └── lib/          # api client, auth context, formatters
│   └── vite.config.js
│
└── .github/workflows/ci.yml
```

### How the original classes map to the web app

| Original CLI | Web app |
|---|---|
| `Account` (number, PIN, balance in cents, deposit and withdraw) | `models.Account`, plus `services.deposit` and `withdraw` |
| `Bank` (100-account limit, find account, duplicate SSN check, monthly interest) | `services.open_account`, `find_open_account`, `register_user`, `apply_monthly_interest` |
| `BankManager` (menu options 1 to 11) | REST endpoints and React pages |
| `BankUtility` (input checks, dollars to cents, random numbers) | `banking.parse_amount`, `validate_pin`, `generate_account_number` |
| `CoinCollector.parseChange` | `banking.parse_change` |

---

## Getting started

### Requirements
- Python 3.10+
- Node.js 20.19+ (or 22+)

### 1. Backend (Flask API)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

flask --app wsgi seed              # optional: demo users and accounts (prints their PINs)
flask --app wsgi run --port 5000   # API at http://localhost:5000/api
```

`flask seed` creates these demo users (fictional data). Every demo account uses PIN **1234**.

| Email | Password | Role |
|---|---|---|
| `jane@copperleaf.test` | `password123` | customer |
| `admin@copperleaf.test` | `password123` | admin |

To make any registered user an admin, run `flask --app wsgi make-admin you@example.com`.

### 2. Frontend (React)

In a second terminal:

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173 (sends /api calls to Flask)
```

### 3. Run tests

```bash
cd backend && pytest -q
```

### Production build (one server)

```bash
cd frontend && npm run build       # builds frontend/dist
cd ../backend && flask --app wsgi run
```

Flask serves the built React app at `/` and the API at `/api`.

---

## Deploying online (Render)

The repo includes a `Dockerfile`, which builds the React app and runs it with Flask under gunicorn, and a `render.yaml` Blueprint. Together they deploy the web app and a PostgreSQL database on [Render](https://render.com)'s free tier.

1. Sign in to [render.com](https://render.com) with GitHub.
2. Click **New → Blueprint** and pick the `Banking-App` repository.
3. When Render asks for `ADMIN_EMAILS`, enter the email you'll register with. That account becomes the bank admin.
4. Click **Apply**. The first build takes about 5 minutes. Your site will be at `https://copperleaf-bank.onrender.com`, or a similar address if that name is taken.

Render redeploys automatically every time you push to `main`.

| Environment variable | Purpose |
|---|---|
| `SECRET_KEY`, `JWT_SECRET_KEY` | Generated by Render. Keep them the same: changing `SECRET_KEY` breaks the duplicate-SSN check, and changing either one signs everyone out. |
| `DATABASE_URL` | Connected to the Render PostgreSQL database automatically |
| `SEED_DEMO` | `true` creates the demo users if they don't already exist |
| `ADMIN_EMAILS` | Comma-separated emails that become admins when they register |
| `MAX_ACCOUNTS` | Bank capacity (default 100) |

**Free-tier limits:** the web service goes to sleep after about 15 minutes without visitors, so the next visit takes about a minute to wake it up. Render's free PostgreSQL database expires after 30 days. You can upgrade it, or point `DATABASE_URL` at another free Postgres host such as [Neon](https://neon.tech).

**Other hosts:** the same `Dockerfile` works on Railway, Fly.io and Google Cloud Run. Set `DATABASE_URL`, `SECRET_KEY` and `JWT_SECRET_KEY`. To try the production build on your own computer:

```bash
docker build -t copperleaf .
docker run -p 8000:8000 -e SEED_DEMO=true copperleaf   # http://localhost:8000 (SQLite inside the container)
```

### Running the original command-line version

```bash
python3 BankManager.py
```

---

## REST API

Every endpoint except register, login and `/coins` needs an `Authorization: Bearer <token>` header. Amounts are dollar strings such as `"2.57"`. Responses give money in integer cents.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | `{email, password, firstName, lastName, ssn}` returns a token and the user |
| POST | `/api/auth/login` | `{email, password}` returns a token and the user |
| GET | `/api/auth/me` | The current user |
| GET | `/api/accounts` | Your open accounts (`?all=1` includes closed ones) |
| POST | `/api/accounts` | Open an account: `{kind, nickname, openingDeposit}`. Returns the account and its PIN, once. |
| GET | `/api/accounts/:number` | Account details |
| PATCH | `/api/accounts/:number` | Rename: `{nickname}` |
| PUT | `/api/accounts/:number/pin` | `{currentPin, newPin, confirmPin}` |
| POST | `/api/accounts/:number/deposit` | `{amount, memo?}` |
| POST | `/api/accounts/:number/withdraw` | `{amount, pin}` |
| POST | `/api/accounts/:number/atm` | `{amount, pin}` returns the bill breakdown |
| POST | `/api/accounts/:number/coins` | `{coins: "QQDNP"}` returns the total and any invalid characters |
| POST | `/api/accounts/:number/close` | `{pin}`. The balance must be $0 first. |
| GET | `/api/accounts/:number/transactions` | `?limit&offset&kind` |
| GET | `/api/transactions` | Activity across all your accounts |
| POST | `/api/transfers` | `{from, to, amount, pin, memo?}` |
| GET | `/api/recipients/:number` | Recipient's first name and last initial, to confirm before sending |
| GET | `/api/summary` | Totals and the 30-day balance series |
| GET | `/api/admin/stats` | Admin: deposits, customers, capacity |
| GET | `/api/admin/accounts` | Admin: all accounts |
| POST | `/api/admin/interest` | Admin: `{annualRate}` applies monthly interest |

---

## Roadmap

- [x] Build a responsive React banking dashboard.
- [x] Implement user registration and login.
- [x] Connect Flask REST APIs to React.
- [x] Store users and accounts in an SQL database.
- [x] Implement authenticated banking transactions.
- [x] Add transaction history.
- [x] Display balances and account activity dynamically.
- [x] Improve validation and security (Decimal money, hashed PINs, PIN lockout, SSN HMAC).
- [x] Add automated testing (pytest and GitHub Actions).
- [x] Deploy the application online (Docker and a Render Blueprint).
- [ ] Database migrations (Alembic) and row-level locking for PostgreSQL.
- [ ] Refresh tokens and an httpOnly-cookie session.

## Learning objectives

- Object-oriented programming in Python
- Full-stack application development
- RESTful API design
- Relational database design
- Authentication and authorization
- React component development
- Frontend and backend integration
- Financial transaction processing
- Error handling and testing

## Project status

**Original Python application:** finished as a command-line project. It now includes small bug fixes: the withdrawal balance check, regenerating a duplicate account number, keeping interest in whole cents, and a `__main__` guard.

**Full-stack application:** works end to end. It deploys to Render with one Blueprint.
