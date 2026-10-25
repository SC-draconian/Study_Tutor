"""Simple in-memory rate limiter for API endpoints.

Uses a sliding-window counter per IP address.  No external dependencies
required — the window dict is pruned automatically on each check.
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Dict, List, Tuple

from fastapi import HTTPException, Request


class RateLimiter:
    """Per-IP sliding-window rate limiter.

    Parameters
    ----------
    max_requests : int
        Maximum number of requests allowed in the window.
    window_seconds : int
        Duration of the sliding window in seconds.
    """

    def __init__(self, max_requests: int = 30, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window = window_seconds
        # ip -> list of timestamps
        self._hits: Dict[str, List[float]] = defaultdict(list)

    def _prune(self, ip: str) -> None:
        cutoff = time.time() - self.window
        self._hits[ip] = [t for t in self._hits[ip] if t > cutoff]
        if not self._hits[ip]:
            del self._hits[ip]

    def check(self, request: Request) -> None:
        """Raise 429 if the caller has exceeded the rate limit."""
        ip = request.client.host if request.client else "unknown"
        self._prune(ip)
        hits = self._hits[ip]

        if len(hits) >= self.max_requests:
            retry_after = max(1, int(self.window - (time.time() - hits[0])) + 1)
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. You can make {self.max_requests} AI requests per hour. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(time.time())

    def remaining(self, request: Request) -> Tuple[int, int]:
        """Return (remaining_requests, seconds_until_reset)."""
        ip = request.client.host if request.client else "unknown"
        self._prune(ip)
        used = len(self._hits.get(ip, []))
        remaining = max(0, self.max_requests - used)
        if self._hits.get(ip):
            reset = max(0, int(self.window - (time.time() - self._hits[ip][0])) + 1)
        else:
            reset = self.window
        return remaining, reset


# Shared instance — configured in main.py from settings
ai_limiter: RateLimiter | None = None
