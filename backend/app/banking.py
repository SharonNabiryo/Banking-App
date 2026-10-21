"""Pure banking rules, ported from the original CLI classes.

Account.py / Bank.py / BankUtility.py / CoinCollector.py / BankManager.py held these
rules mixed with input() and print() calls. They live here as side-effect free
functions so the web API and the tests can share them.
"""
import hashlib
import hmac
import re
import secrets
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

# CoinCollector.coin_values
COIN_VALUES = {
    "P": 1,    # penny
    "N": 5,    # nickel
    "D": 10,   # dime
    "Q": 25,   # quarter
    "H": 50,   # half dollar
    "W": 100,  # whole dollar
}

ATM_MIN = 5
ATM_MAX = 1000
ATM_STEP = 5
MAX_TRANSACTION_CENTS = 100_000_000  # $1,000,000 per transaction


class BankingError(Exception):
    """A rule violation that should be shown to the user."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def generate_account_number() -> int:
    """Eight-digit account number (Account.__init__)."""
    return 10_000_000 + secrets.randbelow(90_000_000)


def generate_pin() -> str:
    """Four-digit PIN (Account.__init__)."""
    return str(1000 + secrets.randbelow(9000))


def validate_pin(pin) -> str:
    """Account.setOwnerPin: must be exactly four digits."""
    pin = str(pin or "").strip()
    if len(pin) != 4 or not pin.isdigit():
        raise BankingError("PIN must be exactly 4 digits.")
    return pin


def validate_ssn(ssn) -> str:
    """BankManager option 1: nine digits, starting with 999 (fictional test SSNs only)."""
    ssn = re.sub(r"[\s-]", "", str(ssn or ""))
    if len(ssn) != 9 or not ssn.isdigit() or not ssn.startswith("999"):
        raise BankingError("SSN must be 9 digits and start with 999 (use test data only).")
    return ssn


def hash_ssn(ssn: str, secret: str) -> str:
    """Keyed hash so duplicate SSNs can be detected without storing the SSN itself."""
    return hmac.new(secret.encode(), ssn.encode(), hashlib.sha256).hexdigest()


def mask_ssn(last4: str) -> str:
    """Account.getFormattedSSN"""
    return f"XXX-XX-{last4}"


def parse_amount(value) -> int:
    """Dollars-and-cents input (e.g. "2.57") -> integer cents.

    Replaces BankUtility.promptUserForPositiveNumber + convertFromDollarsToCents, using
    Decimal so 0.1 + 0.2 style float errors can't creep into balances.
    """
    try:
        amount = Decimal(str(value).strip().replace(",", "").lstrip("$"))
    except (InvalidOperation, AttributeError):
        raise BankingError("Enter a valid amount, e.g. 2.57.")
    if not amount.is_finite():
        raise BankingError("Enter a valid amount, e.g. 2.57.")
    if amount <= 0:
        raise BankingError("Amount must be greater than zero.")
    if amount.as_tuple().exponent < -2:
        raise BankingError("Amount can't have more than two decimal places.")
    cents = int(amount * 100)
    if cents > MAX_TRANSACTION_CENTS:
        raise BankingError("Amount exceeds the $1,000,000 per-transaction limit.")
    return cents


def parse_change(coins: str):
    """CoinCollector.parseChange -> (total_cents, counts per coin, invalid characters)."""
    total = 0
    counts = {symbol: 0 for symbol in COIN_VALUES}
    invalid = []
    for char in str(coins or ""):
        if char.isspace() or char == ",":
            continue
        symbol = char.upper()
        if symbol in COIN_VALUES:
            total += COIN_VALUES[symbol]
            counts[symbol] += 1
        else:
            invalid.append(char)
    return total, counts, invalid


def atm_bills(amount_dollars: int):
    """BankManager option 7: break an ATM withdrawal into $20, $10 and $5 bills."""
    twenties, rest = divmod(amount_dollars, 20)
    tens, rest = divmod(rest, 10)
    fives = rest // 5
    return {"20": twenties, "10": tens, "5": fives}


def validate_atm_amount(value) -> int:
    """$5 – $1,000, whole dollars, multiples of $5. Returns whole dollars."""
    try:
        amount = Decimal(str(value).strip().lstrip("$"))
    except (InvalidOperation, AttributeError):
        raise BankingError("Enter a whole-dollar amount.")
    if not amount.is_finite() or amount != amount.to_integral_value():
        raise BankingError("ATM withdrawals must be whole dollars.")
    dollars = int(amount)
    if dollars < ATM_MIN or dollars > ATM_MAX or dollars % ATM_STEP:
        raise BankingError("ATM withdrawals must be between $5 and $1,000 in multiples of $5.")
    return dollars


def monthly_interest(balance_cents: int, annual_rate_percent) -> int:
    """Bank.addMonthlyInterest: balance * (annual rate / 12), rounded to the cent."""
    rate = Decimal(str(annual_rate_percent))
    interest = Decimal(balance_cents) * rate / Decimal(100) / Decimal(12)
    return int(interest.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def validate_interest_rate(value) -> Decimal:
    try:
        rate = Decimal(str(value).strip().rstrip("%"))
    except (InvalidOperation, AttributeError):
        raise BankingError("Enter an annual rate such as 2.75.")
    if not rate.is_finite() or rate <= 0 or rate > 25:
        raise BankingError("Annual interest rate must be between 0 and 25%.")
    return rate
