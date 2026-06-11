"""
handlers/__init__.py
Exposes the three action-handler modules for easy import.
"""

from .kyc_handler import approve_kyc, reject_kyc
from .loan_handler import fast_track_approve
from .recovery_handler import move_stage
