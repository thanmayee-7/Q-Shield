def calculate_qber(alice_key, bob_key):
    """
    Calculate Quantum Bit Error Rate (QBER).

    QBER = mismatched bits / total compared bits
           × 100
    """

    if len(alice_key) != len(bob_key):
        raise ValueError("Keys must have the same length.")

    if len(alice_key) == 0:
        return 0.0

    errors = sum(
        alice_bit != bob_bit
        for alice_bit, bob_bit in zip(alice_key, bob_key)
    )

    qber = (errors / len(alice_key)) * 100

    return qber


if __name__ == "__main__":

    # Example: no attack
    alice_key = [1, 0, 1, 1, 0, 1, 0, 0]

    bob_key = [1, 0, 1, 1, 0, 1, 0, 0]

    qber = calculate_qber(alice_key, bob_key)

    print("Alice's key:")
    print(alice_key)

    print("\nBob's key:")
    print(bob_key)

    print(f"\nQBER: {qber:.2f}%")