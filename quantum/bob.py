import random


def generate_bases(length):
    """Generate Bob's random measurement bases."""
    return [random.choice(["Z", "X"]) for _ in range(length)]


def measure_qubits(alice_bits, alice_bases, bob_bases):
    """
    Simulate Bob measuring Alice's quantum states.

    If Bob uses the same basis as Alice,
    he gets Alice's original bit.

    If Bob uses a different basis,
    the result is random.
    """

    measurements = []

    for bit, alice_basis, bob_basis in zip(
        alice_bits, alice_bases, bob_bases
    ):

        if alice_basis == bob_basis:
            # Correct basis → Bob gets Alice's bit
            measurements.append(bit)

        else:
            # Wrong basis → measurement is random
            measurements.append(random.randint(0, 1))

    return measurements


if __name__ == "__main__":

    # Example data from Alice
    alice_bits = [1, 0, 1, 1, 0, 0, 1, 0]
    alice_bases = ["Z", "X", "Z", "X", "X", "Z", "Z", "X"]

    # Bob chooses his own random bases
    bob_bases = generate_bases(len(alice_bits))

    # Bob measures
    bob_results = measure_qubits(
        alice_bits,
        alice_bases,
        bob_bases
    )

    print("Alice's bits:")
    print(alice_bits)

    print("\nAlice's bases:")
    print(alice_bases)

    print("\nBob's bases:")
    print(bob_bases)

    print("\nBob's measurement results:")
    print(bob_results)