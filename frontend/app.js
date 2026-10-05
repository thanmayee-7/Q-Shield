// ============================================================
// Q-SHIELD — QUANTUM SECURITY COMMAND CENTER
// Frontend Controller
// ============================================================

const API_BASE = "";

const state = {
    evePercent: 0,
    eveProbability: 0,
    lastSession: null,
    lastResult: null,
    busy: false,
    message: "",
    eventCounter: 0
};


// ============================================================
// DOM
// ============================================================

const $ = (id) => document.getElementById(id);

const ui = {
    qberValue: $("qberValue"),
    qberStatus: $("qberStatus"),
    qberFill: $("qberFill"),

    keyLength: $("keyLength"),
    keyStatus: $("keyStatus"),

    eveCount: $("eveCount"),
    eveState: $("eveState"),

    threatLevel: $("threatLevel"),

    secureMessage: $("secureMessage"),
    sendMessageButton: $("sendMessageButton"),
    messageState: $("messageState"),
    messageText: $("messageText"),

    generateButton: $("generateButton"),
    attackButton: $("attackButton"),

    eveSlider: $("eveSlider"),
    eveProbability: $("eveProbability"),

    securityIcon: $("securityIcon"),
    securityStatus: $("securityStatus"),
    securityDescription: $("securityDescription"),

    eventLog: $("eventLog")
};


// ============================================================
// HELPERS
// ============================================================

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function now() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


function formatPercent(value) {
    return `${Number(value).toFixed(2)}%`;
}


function addEvent(type, message) {
    if (!ui.eventLog) return;

    state.eventCounter++;

    const row = document.createElement("div");
    row.className = `event event-${type.toLowerCase()}`;

    row.innerHTML = `
        <span class="event-time">${now()}</span>
        <span class="event-type">${type}</span>
        <span class="event-message">${message}</span>
    `;

    ui.eventLog.prepend(row);

    // Keep dashboard readable
    while (ui.eventLog.children.length > 12) {
        ui.eventLog.removeChild(ui.eventLog.lastChild);
    }
}


// ============================================================
// SECURITY CLASSIFICATION
// ============================================================

function classifySecurity(qber, evePercent) {

    /*
        Prototype policy:

        0–3%      → SECURE
        >3–8%     → GUARDED
        >8–11%    → HIGH
        >11%      → CRITICAL

        11% is the prototype's configured policy threshold.
        It is NOT a universal real-world QKD threshold.
    */

    if (qber <= 3) {
        return {
            level: "LOW",
            label: "SECURE",
            description: "Quantum channel integrity verified.",
            icon: "✓",
            accepted: true,
            colorClass: "secure"
        };
    }

    if (qber <= 8) {
        return {
            level: "GUARDED",
            label: "MONITOR",
            description: "Elevated quantum error detected.",
            icon: "◐",
            accepted: true,
            colorClass: "guarded"
        };
    }

    if (qber <= 11) {
        return {
            level: "HIGH",
            label: "HIGH RISK",
            description: "QBER approaching security policy limit.",
            icon: "!",
            accepted: true,
            colorClass: "high"
        };
    }

    return {
        level: "CRITICAL",
        label: "COMPROMISED",
        description: "QBER exceeds policy. Quantum key rejected.",
        icon: "×",
        accepted: false,
        colorClass: "critical"
    };
}


// ============================================================
// VISUAL STATE
// ============================================================

function setSecurityVisuals(security, result) {

    document.body.classList.remove(
        "state-secure",
        "state-guarded",
        "state-high",
        "state-critical"
    );

    document.body.classList.add(
        `state-${security.colorClass}`
    );


    // Security card
    if (ui.securityIcon) {
        ui.securityIcon.textContent = security.icon;
    }

    if (ui.securityStatus) {
        ui.securityStatus.textContent = security.label;
    }

    if (ui.securityDescription) {
        ui.securityDescription.textContent =
            security.description;
    }


    // Threat level
    if (ui.threatLevel) {
        ui.threatLevel.textContent = security.level;
    }


    // QBER
    if (ui.qberValue) {
        ui.qberValue.textContent =
            formatPercent(result.qber);
    }

    if (ui.qberStatus) {
        ui.qberStatus.textContent =
            result.qber > 11
                ? "ABOVE POLICY"
                : result.qber > 8
                    ? "APPROACHING POLICY"
                    : "WITHIN POLICY";
    }

    if (ui.qberFill) {
        const qberWidth = clamp(
            (result.qber / 25) * 100,
            0,
            100
        );

        ui.qberFill.style.width = `${qberWidth}%`;
    }


    // Key
    if (ui.keyLength) {
        ui.keyLength.textContent =
            `${result.key_length} BITS`;
    }

    if (ui.keyStatus) {
        ui.keyStatus.textContent =
            result.secure
                ? "ACCEPTED"
                : "REJECTED";
    }


    // Eve
    if (ui.eveCount) {
        ui.eveCount.textContent =
            `${result.eve_attack_count} STATES`;
    }

    if (ui.eveState) {
        ui.eveState.textContent =
            result.eve_attack_count > 0
                ? "DETECTED"
                : "INACTIVE";
    }
}


// ============================================================
// EVE SLIDER
// ============================================================

function updateSliderDisplay() {

    if (!ui.eveSlider) return;

    const percent = Number(ui.eveSlider.value);

    state.evePercent = clamp(percent, 0, 100);

    // IMPORTANT:
    // Slider = percentage
    // API = decimal probability
    //
    // 0   → 0.00
    // 25  → 0.25
    // 50  → 0.50
    // 100 → 1.00

    state.eveProbability =
        state.evePercent / 100;


    if (ui.eveProbability) {
        ui.eveProbability.textContent =
            `${state.evePercent}%`;
    }
}


async function handleSliderChange() {
    updateSliderDisplay();

    await runSimulation(
        state.evePercent > 0,
        state.eveProbability
    );
}


// ============================================================
// API
// ============================================================

async function requestSimulation(
    eveEnabled,
    probability
) {

    /*
        NEVER send the slider's raw percentage.

        Wrong:
        probability=50

        Correct:
        probability=0.5
    */

    const safeProbability = clamp(
        Number(probability),
        0,
        1
    );

    const url =
        `${API_BASE}/api/qkd/simulate` +
        `?eve=${eveEnabled}` +
        `&probability=${safeProbability}`;

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `Simulation failed: HTTP ${response.status}`
        );
    }

    return await response.json();
}


// ============================================================
// MAIN SIMULATION
// ============================================================

async function runSimulation(
    eveEnabled = false,
    probability = 0
) {

    if (state.busy) return;

    state.busy = true;

    try {

        if (eveEnabled) {

            addEvent(
                "EVE",
                `Intercept/resend simulation initiated — ${Math.round(probability * 100)}% exposure`
            );

        } else {

            addEvent(
                "SYSTEM",
                "Clean BB84 quantum session initialized"
            );
        }


        await sleep(150);


        addEvent(
            "QUANTUM",
            "Quantum states transmitted from Alice to Bob"
        );


        const result = await requestSimulation(
            eveEnabled,
            probability
        );


        state.lastResult = result;


        // Security classification
        const security = classifySecurity(
            result.qber,
            Math.round(probability * 100)
        );


        setSecurityVisuals(
            security,
            result
        );


        // ====================================================
        // EVENTS
        // ====================================================

        addEvent(
            "ANALYSIS",
            `QBER measured at ${formatPercent(result.qber)}`
        );


        if (result.eve_attack_count > 0) {

            addEvent(
                "EVE",
                `${result.eve_attack_count} quantum states intercepted`
            );

        } else {

            addEvent(
                "QUANTUM",
                "No interception detected"
            );
        }


        if (result.qber > 11) {

            addEvent(
                "SECURITY",
                "QBER ABOVE POLICY — SESSION COMPROMISED"
            );

            addEvent(
                "KEY",
                "SIFTED KEY REJECTED"
            );

        } else {

            addEvent(
                "KEY",
                `Quantum key accepted — ${result.key_length} usable bits`
            );
        }


        // ====================================================
        // CHANNEL STATUS
        // ====================================================

        if (security.level === "LOW") {

            addEvent(
                "CHANNEL",
                "Quantum channel operating normally"
            );

        } else if (security.level === "GUARDED") {

            addEvent(
                "CHANNEL",
                "Elevated noise/interception — monitoring"
            );

        } else if (security.level === "HIGH") {

            addEvent(
                "CHANNEL",
                "High-risk quantum channel detected"
            );

        } else {

            addEvent(
                "CHANNEL",
                "CRITICAL — transmission protection engaged"
            );
        }


        // Update message state
        updateMessageAvailability(result);


    } catch (error) {

        console.error(error);

        addEvent(
            "ERROR",
            error.message
        );

    } finally {

        state.busy = false;
    }
}


// ============================================================
// MESSAGE SECURITY
// ============================================================

function updateMessageAvailability(result) {

    if (!ui.sendMessageButton) return;

    if (result.secure) {

        ui.sendMessageButton.disabled = false;

        ui.sendMessageButton.textContent =
            "ENCRYPT & TRANSMIT";

    } else {

        ui.sendMessageButton.disabled = false;

        ui.sendMessageButton.textContent =
            "ATTEMPT TRANSMISSION";
    }
}


// ============================================================
// MESSAGE FINGERPRINT
// ============================================================

async function createMessageFingerprint(message) {

    const data =
        new TextEncoder().encode(message);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
        .map(byte =>
            byte.toString(16).padStart(2, "0")
        )
        .join("")
        .substring(0, 16)
        .toUpperCase();
}


// ============================================================
// MESSAGE TRANSMISSION
// ============================================================

async function transmitMessage() {

    const message =
        ui.secureMessage?.value.trim();


    if (!message) {

        if (ui.messageState) {
            ui.messageState.textContent =
                "ENTER A MESSAGE";
        }

        if (ui.messageText) {
            ui.messageText.textContent =
                "No payload entered.";
        }

        return;
    }


    const result = state.lastResult;


    if (!result) {

        if (ui.messageState) {
            ui.messageState.textContent =
                "NO ACTIVE SESSION";
        }

        return;
    }


    // ========================================================
    // COMPROMISED CHANNEL
    // ========================================================

    if (!result.secure) {

        if (ui.messageState) {
            ui.messageState.textContent =
                "TRANSMISSION BLOCKED";
        }

        if (ui.messageText) {
            ui.messageText.textContent =
                "Quantum key rejected — secure channel unavailable.";
        }


        addEvent(
            "BLOCK",
            "Sensitive message BLOCKED because quantum key was rejected"
        );

        return;
    }


    // ========================================================
    // SECURE CHANNEL
    // ========================================================

    if (ui.sendMessageButton) {
        ui.sendMessageButton.disabled = true;
        ui.sendMessageButton.textContent =
            "ENCRYPTING...";
    }


    if (ui.messageState) {
        ui.messageState.textContent =
            "ENCRYPTING PAYLOAD...";
    }


    addEvent(
        "CRYPTO",
        "Sensitive payload submitted for protected transmission"
    );


    await sleep(600);


    const fingerprint =
        await createMessageFingerprint(message);


    if (ui.messageState) {
        ui.messageState.textContent =
            "TRANSMISSION DELIVERED";
    }


    if (ui.messageText) {

        ui.messageText.innerHTML = `
            <div class="message-success">
                <strong>✓ SECURE TRANSMISSION</strong>
                <br><br>
                Payload authenticated through active quantum session.
                <br><br>
                <span>MESSAGE FINGERPRINT</span>
                <br>
                <code>${fingerprint}</code>
                <br><br>
                <span>CHANNEL</span>
                <br>
                Q-SHIELD / BB84
            </div>
        `;
    }


    addEvent(
        "DELIVERY",
        `Protected message delivered — fingerprint ${fingerprint}`
    );


    if (ui.sendMessageButton) {
        ui.sendMessageButton.disabled = false;
        ui.sendMessageButton.textContent =
            "ENCRYPT & TRANSMIT";
    }
}


// ============================================================
// GENERATE SECURE KEY
// ============================================================

async function generateSecureKey() {

    if (ui.eveSlider) {
        ui.eveSlider.value = 0;
    }

    state.evePercent = 0;
    state.eveProbability = 0;

    if (ui.eveProbability) {
        ui.eveProbability.textContent = "0%";
    }


    addEvent(
        "SYSTEM",
        "Generating clean quantum session..."
    );


    await runSimulation(
        false,
        0
    );
}


// ============================================================
// SIMULATE ATTACK
// ============================================================

async function simulateAttack() {

    if (ui.eveSlider) {

        /*
            If the slider is currently 0,
            automatically move to a useful demo attack.

            This makes the button judge-friendly.
        */

        if (Number(ui.eveSlider.value) === 0) {
            ui.eveSlider.value = 100;
        }
    }


    updateSliderDisplay();


    addEvent(
        "ALERT",
        `Attack scenario selected — Eve exposure ${state.evePercent}%`
    );


    await runSimulation(
        true,
        state.eveProbability
    );
}


// ============================================================
// LIVE SLIDER EVENTS
// ============================================================

if (ui.eveSlider) {

    ui.eveSlider.addEventListener(
        "input",
        updateSliderDisplay
    );


    ui.eveSlider.addEventListener(
        "change",
        handleSliderChange
    );
}


// ============================================================
// BUTTONS
// ============================================================

if (ui.generateButton) {

    ui.generateButton.addEventListener(
        "click",
        generateSecureKey
    );
}


if (ui.attackButton) {

    ui.attackButton.addEventListener(
        "click",
        simulateAttack
    );
}


if (ui.sendMessageButton) {

    ui.sendMessageButton.addEventListener(
        "click",
        transmitMessage
    );
}


// ============================================================
// MESSAGE PREVIEW
// ============================================================

if (ui.secureMessage) {

    ui.secureMessage.addEventListener(
        "input",
        () => {

            const length =
                ui.secureMessage.value.length;

            if (ui.messageText && length > 0) {

                ui.messageText.textContent =
                    `${length} character payload ready for transmission.`;
            }
        }
    );
}


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Q-SHIELD command center initialized."
        );


        // Initial slider
        updateSliderDisplay();


        addEvent(
            "SYSTEM",
            "Q-SHIELD security fabric online"
        );


        addEvent(
            "SYSTEM",
            "BB84 protocol engine ready"
        );


        // Start with clean channel
        await runSimulation(
            false,
            0
        );
    }
);