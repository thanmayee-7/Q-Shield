import random


def generate_eve_bases(length):
    """Generate random measurement bases for Eve."""
    return [random.choice(["Z", "X"]) for _ in range(length)]


def intercept_resend(alice_bits, alice_bases, eve_bases):
    """
    Simulate Eve's intercept-resend attack.

    Eve measures each qubit using her chosen basis.
    She then prepares a new state based on her measurement
    and sends it toward Bob.
    """

    resent_bits = []
    resent_bases = []

    for bit, alice_basis, eve_basis in zip(
        alice_bits,
        alice_bases,
        eve_bases
    ):

        if alice_basis == eve_basis:
            # Eve used the correct basis.
            measured_bit = bit

        else:
            # Eve used the wrong basis.
            # Her measurement is random.
            measured_bit = random.randint(0, 1)

        # Eve resends what she measured
        resent_bits.append(measured_bit)
        resent_bases.append(eve_basis)

    return resent_bits, resent_bases


if __name__ == "__main__":

    alice_bits = [
        1, 0, 1, 1,
        0, 0, 1, 0
    ]

    alice_bases = [
        "Z", "X", "Z", "X",
        "X", "Z", "Z", "X"
    ]

    eve_bases = generate_eve_bases(len(alice_bits))

    resent_bits, resent_bases = intercept_resend(
        alice_bits,
        alice_bases,
        eve_bases
    )

    print("Alice's bits:")
    print(alice_bits)

    print("\nAlice's bases:")
    print(alice_bases)

    print("\nEve's bases:")
    print(eve_bases)

    print("\nEve's measured/resend bits:")
    print(resent_bits)

    print("\nEve's resend bases:")
    print(resent_bases)