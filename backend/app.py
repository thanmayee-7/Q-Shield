from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from quantum.bb84 import run_bb84


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


app = FastAPI(
    title="Q-SHIELD",
    description="Quantum-Secure Communication & Intrusion Detection",
    version="3.0.0"
)


# ============================================================
# FRONTEND
# ============================================================

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)


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
        "quantum_security": "active",
        "version": "3.0.0"
    }


# ============================================================
# QKD SIMULATION
# ============================================================

@app.get("/api/qkd/simulate")
def simulate_qkd(
    eve: bool = False,
    probability: float = 0.0
):

    probability = max(
        0.0,
        min(1.0, probability)
    )

    total_qubits = 512


    # --------------------------------------------------------
    # Run existing BB84 engine
    # --------------------------------------------------------

    result = run_bb84(
        length=total_qubits,
        eve_enabled=eve,
        eve_probability=probability
    )


    # --------------------------------------------------------
    # QBER
    # --------------------------------------------------------

    qber = round(
        float(result["qber"]),
        2
    )


    # --------------------------------------------------------
    # Threat classification
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


    # --------------------------------------------------------
    # Security explanation
    # --------------------------------------------------------

    if qber > 11:

        security_reason = (
            "QBER exceeded the 11% security threshold. "
            "The shared key must be rejected because "
            "the quantum channel may have been compromised."
        )

    elif qber > 3:

        security_reason = (
            "Elevated quantum error detected. "
            "The channel remains usable but requires monitoring."
        )

    else:

        security_reason = (
            "Quantum channel integrity verified. "
            "Observed error remains within the secure operating range."
        )


    # --------------------------------------------------------
    # Key
    # --------------------------------------------------------

    sifted_key = result.get(
        "sifted_alice_key",
        []
    )


    key_length = len(
        sifted_key
    )


    key_status = (
        "ACCEPTED"
        if result["secure"]
        else "REJECTED"
    )


    # --------------------------------------------------------
    # Main response
    # --------------------------------------------------------

    return {

        "status":
            result["status"],

        "secure":
            result["secure"],

        "protocol":
            "BB84",

        "total_qubits":
            total_qubits,

        "qber":
            qber,

        "key_length":
            key_length,

        "key_status":
            key_status,

        "eve_enabled":
            result["eve_enabled"],

        "eve_probability":
            result["eve_probability"],

        "eve_percent":
            round(
                probability * 100,
                1
            ),

        "eve_attack_count":
            result["eve_attack_count"],

        "threat_level":
            threat_level,

        "threat_label":
            threat_label,

        "channel_status":
            channel_status,

        "policy_threshold":
            11.0,

        "security_reason":
            security_reason
    }