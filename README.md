# 🛡️ Q-SHIELD

 Quantum-Secure Communication & Intrusion Detection

> *What happens when someone tries to listen to a quantum conversation? 👀*

**Q-SHIELD** is my exploration into the intersection of **Quantum Computing ⚛️, Cybersecurity 🔐, and Secure Communication 🌐**.

I built this project around the **BB84 Quantum Key Distribution (QKD)** protocol to understand how quantum mechanics can be used to establish a shared secret key — and more importantly, how an eavesdropper can actually be **detected** while doing it.

Instead of keeping BB84 as a bunch of equations and theory, I wanted to turn it into something I could **run, interact with, attack, break, and observe**.

So... meet Q-SHIELD. 🚀

---
🚀 Live Demo

** https://q-shield-quantveil.onrender.com **(based on activity)

Try the live BB84 simulation:
- Set Eve to 0% → secure channel
- Increase Eve's interception probability → QBER rises
- Push Eve to 100% → observe the compromised state

## 🧠 Why I Built This

I've been getting deeper into **Quantum Computing**, and one thing that immediately caught my attention was quantum cryptography.

The idea sounded almost too cool:

> You don't necessarily have to *prevent* someone from looking at the communication — you can design the system so that **looking at it changes the system**. 👀⚛️

That led me to BB84.

I wanted to understand things like:

* What are Alice and Bob actually doing?
* Why do they randomly choose bases?
* What exactly does Eve see?
* Why does interception create errors?
* What is QBER?
* How does Alice and Bob know when they shouldn't trust a key?
* And most importantly... **can I actually simulate all of this myself?**

Q-SHIELD is my attempt to answer those questions through code.

---

# ⚛️ So... What Does Q-SHIELD Actually Do?

At its core, the project simulates a BB84 communication session between:

```text
        👩 ALICE
    Critical Control Center
             │
             │  ⚛️ Quantum States
             ▼
      ╔═══════════════╗
      ║ QUANTUM       ║
      ║   CHANNEL     ║
      ╚═══════════════╝
             │
             │
          🕵️ EVE
      "lemme just look..."
             │
             ▼
        👨 BOB
     Remote Facility
```

Alice sends quantum states.

Bob measures them.

Eve can try to intercept them.

Then Q-SHIELD checks what happened to the resulting key.

---

# 🔐 The BB84 Journey

Here's the whole thing without making it sound like a quantum-physics textbook. 😭

### 1️⃣ Alice generates random bits

Alice starts with random binary data:

```text
1 0 1 1 0 0 1 0 ...
```

She also randomly chooses one of two bases for every bit:

```text
Z X Z X X Z Z X ...
```

The two bases used in the simulation are:

* `Z` → computational basis
* `X` → Hadamard / diagonal basis

---

### 2️⃣ Alice sends the quantum states ⚛️

The corresponding quantum states are conceptually transmitted through the quantum channel.

No actual laser beam is flying across my laptop here 😂.

The current project is a **software simulation** of the quantum behavior.

---

### 3️⃣ Bob measures them

Bob doesn't know which basis Alice used.

So he randomly chooses his own:

```text
Z X X Z X X Z ...
```

If Bob happens to choose the same basis Alice used:

```text
Alice → Z
Bob   → Z
       ✅
```

the ideal simulation gives him Alice's bit.

If he chooses differently:

```text
Alice → Z
Bob   → X
       🤷
```

the result becomes probabilistic.

---

### 4️⃣ They compare bases

Alice and Bob can publicly compare their **bases**.

They don't reveal their actual secret bits.

Something like:

```text
Alice:  Z X Z X X Z
Bob:    Z Z Z X X X
        ✓   ✓ ✓
```

Only the matching positions survive.

And those surviving bits become the **sifted key**.

---

# 🕵️ Enter Eve...

Now things get interesting.

Eve is the eavesdropper.

Her job:

> Intercept the quantum states → measure them → resend them to Bob.

Basically:

```text
Alice ───────► Eve ───────► Bob
                👀
           "I know nothing
            about her bases"
```

The problem for Eve is that she doesn't know which basis Alice used.

So sometimes she guesses correctly.

Sometimes she doesn't.

And when she measures using the wrong basis, she can disturb the quantum information.

That disturbance can eventually show up as **errors between Alice's and Bob's keys**.

---

# 📊 QBER — The Important Number

This is where Q-SHIELD starts behaving like a security system.

**QBER = Quantum Bit Error Rate**

The calculation is:

```text
                 mismatched bits
QBER = ───────────────────────────── × 100
                 compared bits
```

For example:

```text
Alice:  1 0 1 1 0
Bob:    1 0 0 1 0
              ↑
            mismatch
```

That's:

```text
1 / 5 × 100 = 20%
```

Higher QBER = 🚨 something is wrong.

It could be interception, noise, or implementation issues.

---

# 🚨 Q-SHIELD Security States

For this prototype, I use an **11% QBER policy threshold**.

The dashboard turns the measured QBER into a security state:

|    QBER | State       | What Q-SHIELD Does |
| ------: | ----------- | ------------------ |
|    ≤ 3% | 🟢 LOW      | Secure             |
|  > 3–8% | 🟡 GUARDED  | Monitor            |
| > 8–11% | 🟠 HIGH     | High Risk          |
|   > 11% | 🔴 CRITICAL | Reject Key         |

So the basic idea is:

```text
        QBER
         │
         ▼
   ┌─────────────┐
   │  Analyze it │
   └──────┬──────┘
          │
    ┌─────┴─────┐
    │           │
  Normal      Too High
    │           │
    ▼           ▼
 🔑 ACCEPT    🚫 REJECT
```

⚠️ The 11% value is a **prototype policy**, not a universal real-world QKD threshold.

---

# 💻 The Dashboard

I didn't want the project to just print:

```text
QBER: 25%
Status: COMPROMISED
```

and call it a day. 😭

So I built a dark **quantum-security command center** style interface.

The dashboard includes:

### ⚛️ Quantum Network

Visual representation of:

```text
Alice → Quantum Channel → Eve → Bob
```

### 📊 QBER Telemetry

Live measurement of the current error rate.

### 🕵️ Eve Control

Choose how much of the quantum traffic Eve intercepts.

```text
0% ──────────────── 100%
```

### 🔑 Key Status

Shows whether the current sifted key is:

```text
ACCEPTED
```

or

```text
REJECTED
```

### 🚨 Threat Level

The interface reacts to the measured QBER:

```text
LOW
GUARDED
HIGH
CRITICAL
```

### 📡 Live Event Stream

The system records events such as:

```text
QUANTUM   Quantum states transmitted
EVE       64 states intercepted
ANALYSIS  QBER measured at 14.06%
SECURITY  QBER ABOVE POLICY
KEY       SIFTED KEY REJECTED
CHANNEL   TRANSMISSION BLOCKED
```

So you can actually **see the attack unfold**.

---

# 🧪 Try Breaking It

This is probably my favorite part. 😭

### 🟢 0% Eve

```text
Eve Exposure: 0%
```

Expected behavior:

```text
QBER ≈ 0%
Key → ACCEPTED
Channel → OPERATIONAL
```

Nice and peaceful. ☮️

---

### 🟡 25% Eve

```text
Eve Exposure: 25%
```

Now the channel starts showing abnormalities.

```text
QBER → increases
Threat → elevated
```

---

### 🟠 50% Eve

```text
Eve Exposure: 50%
```

Things start getting ugly.

The security monitor begins treating the channel as high risk.

---

### 🔴 100% Eve

```text
Eve Exposure: 100%
```

Now Eve is basically saying:

> "I'm not even hiding anymore." 💀

For ideal intercept-resend BB84, the sifted-key QBER approaches approximately:

```text
25%
```

The prototype should therefore detect a major disturbance:

```text
QBER → ~25%
Key → REJECTED
Channel → BLOCKED
```

The exact value can vary because the simulation is finite and randomized.

---

# 🏗️ How It's Built

```text
                 Q-SHIELD
                    │
        ┌───────────┴───────────┐
        │                       │
     FRONTEND                BACKEND
        │                       │
 HTML / CSS / JS             FastAPI
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
              BB84 ENGINE
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
     Alice         Eve          Bob
       │            │            │
       └────────────┼────────────┘
                    ▼
                SIFTING
                    │
                    ▼
                  QBER
                    │
                    ▼
             SECURITY POLICY
                    │
              ┌─────┴─────┐
              ▼           ▼
           ACCEPT       REJECT
              │           │
              ▼           ▼
          TRANSMIT      BLOCK 🚫
```

---

# 📁 Project Structure

```text
Q-SHIELD/
│
├── backend/
│   ├── __init__.py
│   └── app.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── quantum/
│   ├── __init__.py
│   ├── alice.py
│   ├── bob.py
│   ├── eve.py
│   ├── sifting.py
│   ├── qber.py
│   ├── bb84.py
│   └── test_quantum.py
│
├── .gitignore
└── README.md
```

---

# 🛠️ Tech Stack

### ⚛️ Quantum

* Python
* Qiskit
* Qiskit Aer

### ⚙️ Backend

* FastAPI
* Uvicorn

### 🎨 Frontend

* HTML
* CSS
* JavaScript

### 🧰 Development

* VS Code
* Git
* GitHub

---

# 🚀 Running It Locally

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/Q-SHIELD.git
cd Q-SHIELD
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the dependencies:

```powershell
python -m pip install "qiskit[visualization]>=2.1.0"
python -m pip install --prefer-binary "qiskit-aer>=0.17.0"
python -m pip install fastapi uvicorn
```

Start the application:

```powershell
uvicorn backend.app:app --reload
```

Then open:

```text
http://127.0.0.1:8000
```

---

# 🧪 Running the Quantum Simulation

You can also run the BB84 engine directly:

```bash
python -m quantum.bb84
```

This runs a clean session and an intercept-resend attack scenario.

---

# 📚 Things I'm Exploring Through This

This project sits at the intersection of a few areas I'm really interested in:

### ⚛️ Quantum Computing

* Qubits
* Quantum measurement
* Computational basis
* Hadamard basis
* Superposition
* Quantum information

### 🔐 Cryptography

* Key distribution
* Eavesdropping detection
* Error rates
* Secure communication
* Symmetric cryptography

### 💻 Software Engineering

* Python architecture
* API development
* Frontend/backend integration
* Simulation design
* Real-time UI state
* Testing
* Git/GitHub workflows

---

# 🧠 What This Project Taught Me

One of the biggest things I learned while building this is that **QKD isn't simply "quantum encryption."**

The interesting part is the key-distribution process.

The idea is roughly:

```text
Can Eve observe the communication?
          ↓
If yes...
          ↓
Does her observation disturb it?
          ↓
If yes...
          ↓
Can Alice & Bob detect the disturbance?
          ↓
QBER ↑
          ↓
Don't trust the key.
```

That connection between **quantum measurement and cryptographic security** is what made BB84 interesting to me in the first place.

---

# ⚠️ Current Limitations

Q-SHIELD is currently a **software simulation**, not a physical QKD implementation.

There are no actual photons, lasers, single-photon detectors, or optical channels involved.

A real QKD deployment would require significantly more, including:

* Physical quantum hardware
* Authenticated classical communication
* Error correction / information reconciliation
* Privacy amplification
* Finite-key analysis
* Channel-noise modelling
* Device and implementation security
* Carefully defined security assumptions

Also, the current message interface uses a **SHA-256 fingerprint** for demonstration/identification.

It should **not** be interpreted as full end-to-end encryption.

---

# 🔭 Where I Want to Take It

This is definitely not where I want the project to stop. 👀

Some things I'd like to explore next:

* 🔐 Real AES-GCM encryption using accepted key material
* 🧩 Error correction and information reconciliation
* ✂️ Privacy amplification
* 📡 More realistic quantum-channel noise
* 📈 Long-term QBER monitoring
* 🌐 Multi-node quantum networks
* ⚛️ Experiments with real quantum backends
* 🛰️ Integration with optical/FSO communication concepts
* 🛡️ More advanced attack models
* 📊 Security analytics and historical attack data

---

# 🌌 The Bigger Idea

Q-SHIELD started as a way for me to understand **one quantum cryptography protocol**.

But the more I worked on it, the more interesting the bigger picture became:

```text
Quantum Computing
        +
Cybersecurity
        +
Communication Systems
        ↓
   Q-SHIELD
```

There is still a lot I don't know about quantum communication — which is kind of the point of this project.

I'm building it while learning it.

And that's what makes this project fun. ⚛️💻

