import pytest

from app import banking
from app.banking import BankingError


def test_parse_amount_to_cents():
    assert banking.parse_amount("2.57") == 257
    assert banking.parse_amount("$1,000") == 100000
    assert banking.parse_amount("0.1") == 10


@pytest.mark.parametrize("bad", ["0", "-5", "abc", "1.234", "", None, "NaN", "Infinity"])
def test_parse_amount_rejects(bad):
    with pytest.raises(BankingError):
        banking.parse_amount(bad)


def test_parse_change_counts_coins_and_flags_invalid():
    total, counts, invalid = banking.parse_change("PNDQHW x q")
    assert total == 1 + 5 + 10 + 25 + 50 + 100 + 25
    assert counts["Q"] == 2
    assert invalid == ["x"]


def test_atm_bills():
    assert banking.atm_bills(85) == {"20": 4, "10": 0, "5": 1}
    assert banking.atm_bills(35) == {"20": 1, "10": 1, "5": 1}


@pytest.mark.parametrize("bad", ["0", "3", "1005", "12", "20.50"])
def test_atm_amount_rules(bad):
    with pytest.raises(BankingError):
        banking.validate_atm_amount(bad)


def test_monthly_interest_rounds_to_cent():
    # $1,000 at 2.75% APR -> $2.2916.. -> $2.29
    assert banking.monthly_interest(100000, "2.75") == 229


@pytest.mark.parametrize("ssn,ok", [("999123456", True), ("999-12-3456", True),
                                     ("123456789", False), ("99912345", False)])
def test_ssn_rules(ssn, ok):
    if ok:
        assert banking.validate_ssn(ssn) == "999123456"
    else:
        with pytest.raises(BankingError):
            banking.validate_ssn(ssn)


def test_generated_numbers_have_right_length():
    for _ in range(50):
        assert len(str(banking.generate_account_number())) == 8
        assert len(banking.generate_pin()) == 4
