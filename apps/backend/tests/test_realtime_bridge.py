# apps/backend/tests/test_realtime_bridge.py
# emit_soon: sync code (threadpool BackgroundTasks, services on the loop thread) must run its
# publish on the server loop that owns the sockets — never on a private asyncio.run() loop.

import asyncio

from app.WebSocket.publisher import bind_loop, emit_soon


async def _record(ran_on: list) -> None:
    ran_on.append(asyncio.get_running_loop())


def test_emit_from_worker_thread_runs_on_bound_loop():
    async def main() -> bool:
        loop, ran_on = asyncio.get_running_loop(), []
        bind_loop(loop)
        try:
            await asyncio.to_thread(emit_soon, _record(ran_on))
            for _ in range(100):
                if ran_on:
                    break
                await asyncio.sleep(0.01)
        finally:
            bind_loop(None)
        return ran_on == [loop]
    assert asyncio.run(main())


def test_emit_on_loop_thread_is_scheduled_not_run_inline():
    async def main() -> tuple[int, int]:
        ran_on: list = []
        bind_loop(asyncio.get_running_loop())
        try:
            emit_soon(_record(ran_on))
            before = len(ran_on)
            await asyncio.sleep(0)
            return before, len(ran_on)
        finally:
            bind_loop(None)
    assert asyncio.run(main()) == (0, 1)


def test_emit_without_bound_loop_is_dropped():
    ran_on: list = []
    emit_soon(_record(ran_on))
    assert ran_on == []
