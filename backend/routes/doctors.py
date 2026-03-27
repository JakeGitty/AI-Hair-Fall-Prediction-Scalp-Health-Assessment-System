from flask import Blueprint, request, jsonify
import json
import os

doctors_bp = Blueprint('doctors', __name__)

# Path to static doctors data file
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'doctors.json')


def load_doctors():
    """Load all doctors from static JSON file."""
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[doctors] Failed to load doctors.json: {e}")
        return []


@doctors_bp.route('/doctors', methods=['GET'])
def get_doctors():
    """
    GET /doctors?location=<city>
    Returns a list of dermatologists/hair specialists for the given city.
    Falls back to all doctors if city not matched or not provided.
    """
    location = request.args.get('location', '').strip().lower()

    all_doctors = load_doctors()

    if not all_doctors:
        return jsonify({"error": "Doctor data unavailable"}), 500

    if location:
        # Filter by city (case-insensitive substring match)
        filtered = [
            d for d in all_doctors
            if location in d.get('city', '').lower()
            or location in d.get('address', '').lower()
        ]
        # If no match found, return all doctors (better UX than empty list)
        doctors = filtered if filtered else all_doctors
    else:
        doctors = all_doctors

    # Return clean response
    result = []
    for d in doctors:
        result.append({
            "name": d.get("name", ""),
            "clinic": d.get("clinic", ""),
            "speciality": d.get("speciality", ""),
            "address": d.get("address", ""),
            "rating": d.get("rating", None),
            "reviews": d.get("reviews", 0),
            "phone": d.get("phone", ""),
            "maps_url": d.get("maps_url", ""),
            "website": d.get("website", ""),
            "available": d.get("available", "")
        })

    return jsonify(result), 200
