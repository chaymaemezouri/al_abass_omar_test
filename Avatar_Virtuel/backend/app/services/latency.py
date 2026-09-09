"""Per-request latency profiling (contextvar)."""
from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any, Iterator, Optional

logger = logging.getLogger(__name__)

_profile: ContextVar[Optional[dict[str, float]]] = ContextVar(
    "latency_profile", default=None
)
_t0: ContextVar[Optional[float]] = ContextVar("latency_t0", default=None)


def start_latency_profile() -> None:
    _profile.set({})
    _t0.set(time.perf_counter())


def add_latency(step: str, seconds: float) -> None:
    bag = _profile.get()
    if bag is None:
        return
    bag[step] = round(bag.get(step, 0.0) + seconds, 4)


@contextmanager
def time_step(step: str) -> Iterator[None]:
    t0 = time.perf_counter()
    try:
        yield
    finally:
        add_latency(step, time.perf_counter() - t0)


def finish_latency_profile() -> dict[str, Any]:
    bag = dict(_profile.get() or {})
    started = _t0.get()
    total = (time.perf_counter() - started) if started is not None else sum(bag.values())
    bag["total"] = round(total, 4)
    # Percentages of accounted steps (excl. total)
    accounted = sum(v for k, v in bag.items() if k != "total")
    pct = {
        k: round(v / accounted * 100, 1) if accounted > 0 else 0.0
        for k, v in bag.items()
        if k != "total"
    }
    out = {"seconds": bag, "pct_of_timed_steps": pct}
    logger.info(
        "latency_profile total=%.3fs steps=%s",
        bag["total"],
        {k: bag[k] for k in sorted(bag) if k != "total"},
    )
    return out
