# apps/backend/app/Utils/client_ip.py
# The one place that decides "which IP is this caller". Used by the rate limiter key, audit log,
# refresh-token rows and DSGVO consent evidence (booking/contact IP).
#
# Topology: browser → nginx → Next.js BFF → uvicorn, and API callers → nginx → uvicorn. Every hop
# into uvicorn is loopback, so the socket peer alone would put every visitor in one bucket.
# Rule: X-Forwarded-For is read ONLY when the socket peer is a configured trusted proxy
# (settings.TRUSTED_PROXIES, default loopback), and then from the RIGHT — the first hop that is not
# itself a trusted proxy is the client. The left-most entries are whatever the client typed and are
# never believed. nginx appends $remote_addr; the BFF sends the visitor's nginx-set X-Real-IP.
# uvicorn runs with --no-proxy-headers so request.client is always the real socket peer.
import ipaddress
from starlette.requests import HTTPConnection
from config.settings import settings

_Address = ipaddress.IPv4Address | ipaddress.IPv6Address
_Network = ipaddress.IPv4Network | ipaddress.IPv6Network


def parse_networks(raw: str) -> tuple[_Network, ...]:
    return tuple(ipaddress.ip_network(p.strip(), strict=False) for p in raw.split(",") if p.strip())


_TRUSTED = parse_networks(settings.TRUSTED_PROXIES)


def _addr(value: str | None) -> _Address | None:
    try:
        ip = ipaddress.ip_address((value or "").strip())
    except ValueError:
        return None
    return (ip.ipv4_mapped or ip) if isinstance(ip, ipaddress.IPv6Address) else ip


def resolve_client_ip(peer: str | None, forwarded_for: str | None, trusted: tuple[_Network, ...] = _TRUSTED) -> str:
    peer_ip = _addr(peer)
    if peer_ip is None or not any(peer_ip in n for n in trusted):
        return str(peer_ip) if peer_ip else (peer or "unknown")
    for hop in reversed((forwarded_for or "").split(",")):
        ip = _addr(hop)
        if ip is None:
            break  # malformed chain: stop believing it rather than guess past the garbage
        if not any(ip in n for n in trusted):
            return str(ip)
    return str(peer_ip)


def client_ip(request: HTTPConnection) -> str:
    return resolve_client_ip(request.client.host if request.client else None, ",".join(request.headers.getlist("x-forwarded-for")))
