# apps/backend/tests/test_route_handlers_sync.py
# The data layer is sync SQLAlchemy. An `async def` route that calls it runs the query ON the event
# loop: requests serialise, and under a burst the loop blocks in pool.checkout() while the
# connections it waits for can only be returned by teardowns that need the loop — a deadlock (seen
# as every pool connection "idle in transaction" and the API hanging). FastAPI runs a plain `def`
# handler in its threadpool, so a handler may be `async` only if it genuinely awaits something.

import ast
from pathlib import Path

ROUTES = Path(__file__).resolve().parent.parent / "routes"
ROUTE_DECORATORS = {"get", "post", "put", "patch", "delete", "api_route"}


def test_route_handlers_that_do_not_await_are_sync():
    offenders = []
    for path in sorted(ROUTES.rglob("*.py")):
        for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
            if not isinstance(node, ast.AsyncFunctionDef):
                continue
            is_route = any(isinstance(d, ast.Call) and getattr(d.func, "attr", "") in ROUTE_DECORATORS for d in node.decorator_list)
            awaits = any(isinstance(x, (ast.Await, ast.AsyncFor, ast.AsyncWith)) for x in ast.walk(node))
            if is_route and not awaits:
                offenders.append(f"{path.relative_to(ROUTES)}:{node.lineno} {node.name}")
    assert not offenders, "use `def` (threadpool) for handlers that call sync code:\n" + "\n".join(offenders)
