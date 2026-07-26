"""
Catalyst Cloud Scale function entrypoint for retrain_job.

Catalyst expects a function named `handler` in this file.
We delegate to the handler module to keep the logic clean.
"""
from handler import handler  # noqa: F401
