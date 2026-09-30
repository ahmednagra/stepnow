# apps/backend/app/Utils/rate_limit.py
# Per-client limits (slowapi decorators) keyed on the resolved client IP, plus a per-account
# failed-login throttle that slowapi cannot express (its key func never sees the body). Both use
# settings.RATE_LIMIT_STORAGE_URI — memory:// per process today, redis:// once there are workers.
from limits import parse_many
from limits.storage import storage_from_string
from limits.strategies import FixedWindowRateLimiter
from slowapi import Limiter
from app.Utils.client_ip import client_ip
from config.settings import settings

limiter = Limiter(key_func=client_ip, storage_uri=settings.RATE_LIMIT_STORAGE_URI)


class LoginThrottle:
    """Counts FAILED logins per normalized email across all IPs. Only failures count, and a
    success clears the counter, so a legitimate admin is not locked out by their own typo."""

    _NS = "login-fail"

    def __init__(self, spec: str, storage_uri: str):
        self._limits = parse_many(spec)
        self._window = FixedWindowRateLimiter(storage_from_string(storage_uri))

    def blocked(self, account: str) -> bool:
        return any(not self._window.test(lim, self._NS, account) for lim in self._limits)

    def failed(self, account: str) -> None:
        for lim in self._limits:
            self._window.hit(lim, self._NS, account)

    def succeeded(self, account: str) -> None:
        for lim in self._limits:
            self._window.clear(lim, self._NS, account)


login_throttle = LoginThrottle(settings.LOGIN_ACCOUNT_FAILURE_LIMIT, settings.RATE_LIMIT_STORAGE_URI)
