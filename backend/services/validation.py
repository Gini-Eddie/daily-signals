import math
from fastapi import HTTPException


def validate_habit(data):
    def invalid(message):
        raise HTTPException(400, message)
    if not isinstance(data.get("name"), str) or not data["name"].strip():
        invalid("Enter a habit name.")
    tracking = data.get("tracking_type")
    if tracking not in ("BINARY", "QUANTITY", "MINIMUM_TARGET"):
        invalid("Choose a valid tracking type.")
    days = data.get("applicable_days")
    if not days or any(type(day) is not int or day < 0 or day > 6 for day in days):
        invalid("Choose at least one valid scheduled day.")
    if tracking != "BINARY":
        target = data.get("target_value")
        if not isinstance(target, (int, float)) or not math.isfinite(target) or target <= 0:
            invalid("Set a target greater than zero.")
        if tracking == "MINIMUM_TARGET":
            minimum = data.get("minimum_value")
            if not isinstance(minimum, (int, float)) or not math.isfinite(minimum) or minimum < 0 or minimum > target:
                invalid("Minimum must be between zero and your target.")
