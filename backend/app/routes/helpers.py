from functools import wraps

from flask import request
from flask_jwt_extended import current_user, jwt_required

from ..banking import BankingError


def body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if not current_user.is_admin:
            raise BankingError("Administrator access required.", 403)
        return fn(*args, **kwargs)

    return wrapper


def int_arg(name, default, minimum=0, maximum=200):
    try:
        value = int(request.args.get(name, default))
    except (TypeError, ValueError):
        value = default
    return max(minimum, min(maximum, value))
