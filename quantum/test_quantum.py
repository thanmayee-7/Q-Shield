from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


# Create a circuit with one qubit and one classical bit
qc = QuantumCircuit(1, 1)

# Put the qubit into superposition
qc.h(0)

# Measure the qubit
qc.measure(0, 0)

print("Quantum circuit:")
print(qc)

# Create local simulator
simulator = AerSimulator()

# Run the circuit
job = simulator.run(qc, shots=1000)

result = job.result()
counts = result.get_counts()

print("\nMeasurement results:")
print(counts)