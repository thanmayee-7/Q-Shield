import random

from quantum.alice import create_alice_data
from quantum.bob import generate_bases, measure_qubits
from quantum.sifting import sift_key
from quantum.qber import calculate_qber
from quantum.eve import generate_eve_bases, intercept_resend


def run_bb84(
    length=32,
    eve_enabled=False,
    eve_probability=1.0
):
    """
    Run a complete BB84 Quantum Key Distribution simulation.

    Parameters
    ----------
    length : int
        Number of quantum states transmitted.

    eve_enabled : bool
        Whether Eve is active.

    eve_probability : float
        Probability that Eve intercepts each quantum state.
        0.0 = no interception
        1.0 = intercept every state

    Returns
    -------
    dict
        Complete BB84 session information.
    """

    # =========================================================
    # 1. ALICE — Generate random bits and bases
    # =========================================================

    alice_bits, alice_bases = create_alice_data(length)

    # =========================================================
    # 2. QUANTUM CHANNEL
    # =========================================================

    transmitted_bits = alice_bits.copy()
    transmitted_bases = alice_bases.copy()

    # =========================================================
    # 3. EVE — Optional intercept-resend attack
    # =========================================================

    eve_active_positions = []

    if eve_enabled:

        # Eve chooses random bases
        eve_bases = generate_eve_bases(length)

        attacked_bits = []
        attacked_bases = []

        for i in range(length):

            # Decide whether Eve attacks this particular state
            intercepted = random.random() < eve_probability

            if intercepted:

                eve_active_positions.append(i)

                # Eve intercepts and resends the state
                resent_bits, resent_bases = intercept_resend(
                    [transmitted_bits[i]],
                    [transmitted_bases[i]],
                    [eve_bases[i]]
                )

                attacked_bits.append(resent_bits[0])
                attacked_bases.append(resent_bases[0])

            else:

                # Eve does not touch this state
                attacked_bits.append(transmitted_bits[i])
                attacked_bases.append(transmitted_bases[i])

        # What Bob receives after Eve's interaction
        transmitted_bits = attacked_bits
        transmitted_bases = attacked_bases

    # =========================================================
    # 4. BOB — Choose random measurement bases
    # =========================================================

    bob_bases = generate_bases(length)

    # Bob measures the received quantum states
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

    # Prototype threshold.
    #
    # IMPORTANT:
    # This is NOT a universal real-world QKD threshold.
    # Real QKD security depends on protocol implementation,
    # channel noise, finite-key analysis, error correction,
    # privacy amplification, authentication, etc.

    security_threshold = 11.0

    if qber <= security_threshold:

        secure = True
        status = "SECURE"

    else:

        secure = False
        status = "COMPROMISED"

    # =========================================================
    # 8. RETURN COMPLETE SESSION
    # =========================================================

    return {
        "alice_bits": alice_bits,
        "alice_bases": alice_bases,

        "bob_bases": bob_bases,
        "bob_results": bob_results,

        "sifted_alice_key": sifted_alice_key,
        "sifted_bob_key": sifted_bob_key,

        "kept_positions": kept_positions,

        "qber": qber,

        "secure": secure,
        "status": status,

        "eve_enabled": eve_enabled,
        "eve_probability": eve_probability,

        "eve_active_positions": eve_active_positions,
        "eve_attack_count": len(eve_active_positions),

        "transmitted_bits": transmitted_bits,
        "transmitted_bases": transmitted_bases,
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

    print(f"QBER: {secure_session['qber']:.2f}%")
    print(
        f"Key length: "
        f"{len(secure_session['sifted_alice_key'])} bits"
    )
    print(f"Status: {secure_session['status']}")

    # ---------------------------------------------------------
    # TEST 2 — EVE ON
    # ---------------------------------------------------------

    print("\n[TEST 2] EVE ON — 100% INTERCEPTION")
    print("-" * 60)

    attack_session = run_bb84(
        length=32,
        eve_enabled=True,
        eve_probability=1.0
    )

    print(f"QBER: {attack_session['qber']:.2f}%")
    print(
        f"Key length: "
        f"{len(attack_session['sifted_alice_key'])} bits"
    )
    print(f"Status: {attack_session['status']}")
    print(
        f"Eve intercepted: "
        f"{attack_session['eve_attack_count']} states"
    )

    print("\n" + "=" * 60)