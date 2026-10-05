import random


def generate_bits(length):
    """Generate random 0/1 bits."""
    return [random.randint(0, 1) for _ in range(length)]


def generate_bases(length):
    """Generate random Z/X bases."""
    return [random.choice(["Z", "X"]) for _ in range(length)]


def create_alice_data(length=16):
    """Generate Alice's random bits and bases."""
    bits = generate_bits(length)
    bases = generate_bases(length)

    return bits, bases


if __name__ == "__main__":
    bits, bases = create_alice_data(16)

    print("Alice's secret bits:")
    print(bits)

    print("\nAlice's bases:")
    print(bases)