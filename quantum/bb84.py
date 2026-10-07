import random

from quantum.alice import create_alice_data
from quantum.bob import generate_bases, measure_qubits
from quantum.sifting import sift_key
from quantum.qber import calculate_qber
from quantum.eve import generate_eve_bases, intercept_resend


SECURITY_THRESHOLD = 11.0


def _encode_state(bit, basis):
    """
    Convert a classical bit + basis into a human-readable
    BB84 state representation.
    """

    if basis == "+":
        return "|0⟩" if bit == 0 else "|1⟩"

    if basis in ("x", "X", "×"):
        return "|+⟩" if bit == 0 else "|−⟩"

    return f"|{bit}⟩"


def _safe_bit(value):
    """
    Convert values returned by the quantum modules into
    JSON-friendly integer bits when possible.
    """

    try:
        return int(value)
    except (TypeError, ValueError):
        return value


def run_bb84(
    length=32,
    eve_enabled=False,
    eve_probability=1.0
):
    """
    Run a complete BB84 Quantum Key Distribution simulation.

    In addition to the original BB84 result, this version
    produces per-qubit telemetry for Q-SHIELD's visual
    replay and security dashboard.
    """

    # =========================================================
    # 0. NORMALIZE INPUT
    # =========================================================

    length = max(1, int(length))

    eve_probability = max(
        0.0,
        min(1.0, float(eve_probability))
    )

    # =========================================================
    # 1. ALICE
    # =========================================================

    alice_bits, alice_bases = create_alice_data(length)

    # =========================================================
    # 2. INITIAL QUANTUM CHANNEL
    # =========================================================

    transmitted_bits = alice_bits.copy()
    transmitted_bases = alice_bases.copy()

    # =========================================================
    # 3. EVE
    # =========================================================

    eve_active_positions = []

    # Keep detailed Eve telemetry for every qubit.
    eve_bases = [None] * length
    eve_measurements = [None] * length
    eve_states = [None] * length

    # The actual state/basis after Eve's possible
    # intercept-resend operation.
    post_eve_bits = alice_bits.copy()
    post_eve_bases = alice_bases.copy()

    if eve_enabled:

        # Eve independently chooses a random basis
        # for every transmitted state.
        generated_eve_bases = generate_eve_bases(length)

        for i in range(length):

            intercepted = (
                random.random() <
                eve_probability
            )

            if intercepted:

                eve_active_positions.append(i)

                eve_bases[i] = (
                    generated_eve_bases[i]
                )

                # Eve measures Alice's state and
                # prepares a replacement state.
                resent_bits, resent_bases = intercept_resend(
                    [alice_bits[i]],
                    [alice_bases[i]],
                    [generated_eve_bases[i]]
                )

                post_eve_bits[i] = (
                    resent_bits[0]
                )

                post_eve_bases[i] = (
                    resent_bases[0]
                )

                eve_measurements[i] = (
                    _safe_bit(resent_bits[0])
                )

                eve_states[i] = _encode_state(
                    resent_bits[0],
                    generated_eve_bases[i]
                )

            else:

                # Eve did not touch this state.
                post_eve_bits[i] = (
                    alice_bits[i]
                )

                post_eve_bases[i] = (
                    alice_bases[i]
                )

    # These are the values actually travelling toward Bob.
    transmitted_bits = post_eve_bits.copy()
    transmitted_bases = post_eve_bases.copy()

    # =========================================================
    # 4. BOB
    # =========================================================

    bob_bases = generate_bases(length)

    bob_results = measure_qubits(
        transmitted_bits,
        transmitted_bases,
        bob_bases
    )

    # =========================================================
    # 5. SIFTING
    # =========================================================

    (
        sifted_alice_key,
        sifted_bob_key,
        kept_positions
    ) = sift_key(
        alice_bits,
        alice_bases,
        bob_bases,
        bob_results
    )

    # =========================================================
    # 6. QBER
    # =========================================================

    qber = calculate_qber(
        sifted_alice_key,
        sifted_bob_key
    )

    # =========================================================
    # 7. SECURITY POLICY
    # =========================================================

    if qber <= SECURITY_THRESHOLD:

        secure = True
        status = "SECURE"

    else:

        secure = False
        status = "COMPROMISED"

    # =========================================================
    # 8. BUILD QUANTUM TELEMETRY
    # =========================================================

    kept_position_set = set(
        kept_positions
    )

    # Map each retained position to its position
    # inside the sifted key.
    sifted_index_map = {}

    for sifted_index, original_position in enumerate(
        kept_positions
    ):
        sifted_index_map[
            original_position
        ] = sifted_index

    qubits = []

    for i in range(length):

        alice_bit = _safe_bit(
            alice_bits[i]
        )

        bob_bit = _safe_bit(
            bob_results[i]
        )

        alice_basis = alice_bases[i]
        bob_basis = bob_bases[i]

        is_sifted = (
            i in kept_position_set
        )

        is_error = False

        if is_sifted:

            is_error = (
                alice_bit != bob_bit
            )

        qubit = {

            # -------------------------------------------------
            # Identity
            # -------------------------------------------------

            "index": i + 1,

            "position": i,

            # -------------------------------------------------
            # Alice
            # -------------------------------------------------

            "alice_bit": alice_bit,

            "alice_basis": alice_basis,

            "encoded_state":
                _encode_state(
                    alice_bit,
                    alice_basis
                ),

            # -------------------------------------------------
            # Eve
            # -------------------------------------------------

            "eve_intercepted":
                i in eve_active_positions,

            "eve_basis":
                eve_bases[i],

            "eve_measurement":
                eve_measurements[i],

            "eve_state":
                eve_states[i],

            # -------------------------------------------------
            # Bob
            # -------------------------------------------------

            "bob_basis":
                bob_basis,

            "bob_bit":
                bob_bit,

            "bob_state":
                _encode_state(
                    bob_bit,
                    bob_basis
                ),

            # -------------------------------------------------
            # Sifting
            # -------------------------------------------------

            "sifted":
                is_sifted,

            "discarded":
                not is_sifted,

            "sifted_index":
                sifted_index_map.get(i),

            # -------------------------------------------------
            # Error analysis
            # -------------------------------------------------

            "error":
                is_error,

            "error_contribution":
                1 if is_error else 0
        }

        qubits.append(qubit)

    # =========================================================
    # 9. TELEMETRY SUMMARY
    # =========================================================

    eve_attack_count = len(
        eve_active_positions
    )

    retained_count = len(
        kept_positions
    )

    discarded_count = (
        length -
        retained_count
    )

    error_count = sum(
        1
        for qubit in qubits
        if qubit["error"]
    )

    # =========================================================
    # 10. SECURITY EXPLANATION
    # =========================================================

    if qber > SECURITY_THRESHOLD:

        security_reason = (
            "QBER exceeded the 11% prototype "
            "security threshold. The shared key "
            "must be rejected because the quantum "
            "channel may have been compromised."
        )

        threat_level = "CRITICAL"
        threat_label = "COMPROMISED"
        channel_status = "BLOCKED"

    elif qber > 8:

        security_reason = (
            "QBER is approaching the configured "
            "security threshold. The channel is "
            "operating under elevated risk."
        )

        threat_level = "HIGH"
        threat_label = "HIGH RISK"
        channel_status = "AT RISK"

    elif qber > 3:

        security_reason = (
            "Elevated quantum error was observed. "
            "The channel remains usable but should "
            "be monitored."
        )

        threat_level = "GUARDED"
        threat_label = "MONITOR"
        channel_status = "ELEVATED"

    else:

        security_reason = (
            "Quantum channel integrity verified. "
            "Observed error remains within the "
            "secure operating range."
        )

        threat_level = "LOW"
        threat_label = "SECURE"
        channel_status = "OPERATIONAL"

    # =========================================================
    # 11. RETURN COMPLETE SESSION
    # =========================================================

    return {

        # -----------------------------------------------------
        # Original fields — preserved for compatibility
        # -----------------------------------------------------

        "alice_bits":
            alice_bits,

        "alice_bases":
            alice_bases,

        "bob_bases":
            bob_bases,

        "bob_results":
            bob_results,

        "sifted_alice_key":
            sifted_alice_key,

        "sifted_bob_key":
            sifted_bob_key,

        "kept_positions":
            kept_positions,

        "qber":
            qber,

        "secure":
            secure,

        "status":
            status,

        "eve_enabled":
            eve_enabled,

        "eve_probability":
            eve_probability,

        "eve_active_positions":
            eve_active_positions,

        "eve_attack_count":
            eve_attack_count,

        "transmitted_bits":
            transmitted_bits,

        "transmitted_bases":
            transmitted_bases,

        # -----------------------------------------------------
        # NEW Q-SHIELD telemetry
        # -----------------------------------------------------

        "protocol":
            "BB84",

        "security_threshold":
            SECURITY_THRESHOLD,

        "total_qubits":
            length,

        "qubits":
            qubits,

        "telemetry": {

            "transmitted":
                length,

            "received":
                length,

            "eve_intercepted":
                eve_attack_count,

            "eve_interception_rate":
                (
                    eve_attack_count / length
                    if length > 0
                    else 0
                ),

            "bases_compared":
                length,

            "retained":
                retained_count,

            "discarded":
                discarded_count,

            "errors":
                error_count,

            "qber":
                qber
        },

        # -----------------------------------------------------
        # Security intelligence
        # -----------------------------------------------------

        "threat": {

            "level":
                threat_level,

            "label":
                threat_label,

            "channel_status":
                channel_status,

            "reason":
                security_reason
        },

        # -----------------------------------------------------
        # Replay information
        # -----------------------------------------------------

        "replay": {

            "available":
                True,

            "event_count":
                length
        }
    }


# =============================================================
# LOCAL TEST
# =============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("Q-SHIELD — BB84 QUANTUM KEY DISTRIBUTION")
    print("=" * 60)

    # ---------------------------------------------------------
    # TEST 1 — EVE OFF
    # ---------------------------------------------------------

    print("\n[TEST 1] EVE OFF")
    print("-" * 60)

    secure_session = run_bb84(
        length=32,
        eve_enabled=False
    )

    print(
        f"QBER: "
        f"{secure_session['qber']:.2f}%"
    )

    print(
        f"Key length: "
        f"{len(secure_session['sifted_alice_key'])} bits"
    )

    print(
        f"Status: "
        f"{secure_session['status']}"
    )

    print(
        f"Qubits recorded: "
        f"{len(secure_session['qubits'])}"
    )

    # ---------------------------------------------------------
    # TEST 2 — EVE ON
    # ---------------------------------------------------------

    print(
        "\n[TEST 2] EVE ON — 100% INTERCEPTION"
    )

    print("-" * 60)

    attack_session = run_bb84(
        length=32,
        eve_enabled=True,
        eve_probability=1.0
    )

    print(
        f"QBER: "
        f"{attack_session['qber']:.2f}%"
    )

    print(
        f"Key length: "
        f"{len(attack_session['sifted_alice_key'])} bits"
    )

    print(
        f"Status: "
        f"{attack_session['status']}"
    )

    print(
        f"Eve intercepted: "
        f"{attack_session['eve_attack_count']} states"
    )

    print(
        f"Errors: "
        f"{attack_session['telemetry']['errors']}"
    )

    print(
        f"Threat: "
        f"{attack_session['threat']['level']}"
    )

    print("\n" + "=" * 60)