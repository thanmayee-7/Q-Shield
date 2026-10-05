from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from quantum.bb84 import run_bb84


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Q-SHIELD",
    description="Quantum-Secure Communication & Intrusion Detection",
    version="2.0.0"
)


app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)


# ============================================================
# FRONTEND
# ============================================================

@app.get("/")
def serve_frontend():
    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


# ============================================================
# SYSTEM STATUS
# ============================================================

@app.get("/api/status")
def system_status():

    return {
        "project": "Q-SHIELD",
        "status": "online",
        "system": "operational",
        "protocol": "BB84",
        "quantum_security": "active"
    }


# ============================================================
# QKD SIMULATION
# ============================================================

@app.get("/api/qkd/simulate")
def simulate_qkd(
    eve: bool = False,
    probability: float = 0.0
):

    # --------------------------------------------------------
    # IMPORTANT
    # --------------------------------------------------------
    # probability is expected as:
    #
    # 0.0  = 0%
    # 0.25 = 25%
    # 0.50 = 50%
    # 1.0  = 100%
    #
    # We clamp it so invalid values cannot break the system.
    # --------------------------------------------------------

    probability = max(
        0.0,
        min(1.0, probability)
    )


    # More qubits gives a more stable demonstration
    # while still preserving randomness.
    total_qubits = 512


    result = run_bb84(
        length=total_qubits,
        eve_enabled=eve,
        eve_probability=probability
    )


    qber = round(
        result["qber"],
        2
    )


    # --------------------------------------------------------
    # SECURITY POLICY
    # --------------------------------------------------------

    if qber <= 3:

        threat_level = "LOW"
        threat_label = "SECURE"
        channel_status = "OPERATIONAL"

    elif qber <= 8:

        threat_level = "GUARDED"
        threat_label = "MONITOR"
        channel_status = "ELEVATED"

    elif qber <= 11:

        threat_level = "HIGH"
        threat_label = "HIGH RISK"
        channel_status = "AT RISK"

    else:

        threat_level = "CRITICAL"
        threat_label = "COMPROMISED"
        channel_status = "BLOCKED"


    return {

        # Core result
        "status": result["status"],
        "secure": result["secure"],

        # Quantum telemetry
        "qber": qber,
        "key_length": len(
            result["sifted_alice_key"]
        ),

        # Eve telemetry
        "eve_enabled": result["eve_enabled"],
        "eve_probability": result["eve_probability"],
        "eve_percent": round(
            probability * 100,
            1
        ),
        "eve_attack_count": result[
            "eve_attack_count"
        ],

        # System
        "total_qubits": total_qubits,

        # Security interpretation
        "threat_level": threat_level,
        "threat_label": threat_label,
        "channel_status": channel_status,

        # Policy
        "policy_threshold": 11.0,

        # Useful dashboard information
        "key_status":
            "ACCEPTED"
            if result["secure"]
            else "REJECTED"
    }