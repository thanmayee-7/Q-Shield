def sift_key(alice_bits, alice_bases, bob_bases, bob_results):
    """
    Compare Alice's and Bob's bases.

    Keep only positions where both used the same basis.
    """

    sifted_alice_key = []
    sifted_bob_key = []
    kept_positions = []

    for i, (alice_basis, bob_basis) in enumerate(
        zip(alice_bases, bob_bases)
    ):

        if alice_basis == bob_basis:
            sifted_alice_key.append(alice_bits[i])
            sifted_bob_key.append(bob_results[i])
            kept_positions.append(i)

    return (
        sifted_alice_key,
        sifted_bob_key,
        kept_positions
    )


if __name__ == "__main__":

    alice_bits = [1, 0, 1, 1, 0, 0, 1, 0]

    alice_bases = [
        "Z", "X", "Z", "X",
        "X", "Z", "Z", "X"
    ]

    bob_bases = [
        "Z", "Z", "Z", "X",
        "X", "X", "Z", "Z"
    ]

    bob_results = [
        1, 1, 1, 1,
        0, 1, 1, 0
    ]

    alice_key, bob_key, positions = sift_key(
        alice_bits,
        alice_bases,
        bob_bases,
        bob_results
    )

    print("Kept positions:")
    print(positions)

    print("\nAlice's sifted key:")
    print(alice_key)

    print("\nBob's sifted key:")
    print(bob_key)