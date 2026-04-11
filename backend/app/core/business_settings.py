"""Runtime business settings persisted to a small JSON file."""
from __future__ import annotations

import json
import os
from threading import Lock

from app.core.config import settings


class BusinessSettingsStore:
	def __init__(self) -> None:
		self._lock = Lock()
		self._cache = {
			"tax_rate": float(settings.TAX_RATE),
			"currency": str(settings.CURRENCY),
		}

	def load(self) -> dict:
		with self._lock:
			if os.path.exists(settings.RUNTIME_SETTINGS_FILE):
				try:
					with open(settings.RUNTIME_SETTINGS_FILE, "r", encoding="utf-8") as file:
						data = json.load(file)
					self._cache["tax_rate"] = float(data.get("tax_rate", self._cache["tax_rate"]))
					self._cache["currency"] = str(data.get("currency", self._cache["currency"]))
				except Exception:
					# Keep defaults if file is malformed.
					pass
			return dict(self._cache)

	def get(self) -> dict:
		with self._lock:
			return dict(self._cache)

	def update(self, tax_rate: float, currency: str) -> dict:
		with self._lock:
			self._cache["tax_rate"] = float(tax_rate)
			self._cache["currency"] = currency.strip().upper()
			directory = os.path.dirname(settings.RUNTIME_SETTINGS_FILE)
			if directory:
				os.makedirs(directory, exist_ok=True)
			with open(settings.RUNTIME_SETTINGS_FILE, "w", encoding="utf-8") as file:
				json.dump(self._cache, file, indent=2)
			return dict(self._cache)


business_settings_store = BusinessSettingsStore()
