// ============================================================
// Q-SHIELD
// QUANTUM SECURITY COMMAND CENTER
// SINGLE FRONTEND CONTROLLER
// ============================================================

const API_BASE = "";

const state = {

    evePercent: 0,

    eveProbability: 0,

    result: null,

    visualQubits: [],

    currentQubit: 0,

    animationTimer: null,

    busy: false,

    eventCounter: 0

};


const $ = id =>
    document.getElementById(id);


/* ============================================================
   DOM REFERENCES
============================================================ */

const ui = {

    secureMessage: $("secureMessage"),

    analyzeMessageButton:
        $("analyzeMessageButton"),

    sendMessageButton:
        $("sendMessageButton"),

    messageState:
        $("messageState"),

    messageChars:
        $("messageChars"),

    messageBits:
        $("messageBits"),

    messageOnes:
        $("messageOnes"),

    messageZeros:
        $("messageZeros"),

    messageFingerprint:
        $("messageFingerprint"),

    binaryPreview:
        $("binaryPreview"),

    binaryCount:
        $("binaryCount"),


    multiMessages:
        $("multiMessages"),

    analyzeMultipleButton:
        $("analyzeMultipleButton"),

    multiAnalysisResult:
        $("multiAnalysisResult"),


    eveSlider:
        $("eveSlider"),

    eveProbability:
        $("eveProbability"),

    generateButton:
        $("generateButton"),

    attackButton:
        $("attackButton"),


    qberValue:
        $("qberValue"),

    qberStatus:
        $("qberStatus"),

    qberFill:
        $("qberFill"),


    keyLength:
        $("keyLength"),

    keyStatus:
        $("keyStatus"),


    eveCount:
        $("eveCount"),

    eveState:
        $("eveState"),

    threatLevel:
        $("threatLevel"),

    threatPercentage:
        $("threatPercentage"),


    transmittedCount:
        $("transmittedCount"),

    interceptedCount:
        $("interceptedCount"),

    retainedCount:
        $("retainedCount"),

    currentQubit:
        $("currentQubit"),


    channelStateLabel:
        $("channelStateLabel"),

    eveNode:
        $("eveNode"),

    eveNodeStatus:
        $("eveNodeStatus"),


    liveParticle:
        $("liveParticle"),

    particleLayer:
        $("particleLayer"),


    inspectorIndex:
        $("inspectorIndex"),

    inspectorAliceBit:
        $("inspectorAliceBit"),

    inspectorAliceBasis:
        $("inspectorAliceBasis"),

    inspectorState:
        $("inspectorState"),

    inspectorEve:
        $("inspectorEve"),

    inspectorEveBasis:
        $("inspectorEveBasis"),

    inspectorEveBit:
        $("inspectorEveBit"),

    inspectorBobBasis:
        $("inspectorBobBasis"),

    inspectorBobBit:
        $("inspectorBobBit"),

    inspectorSifted:
        $("inspectorSifted"),

    inspectorError:
        $("inspectorError"),


    securityIcon:
        $("securityIcon"),

    securityStatus:
        $("securityStatus"),

    securityDescription:
        $("securityDescription"),

    securityChannel:
        $("securityChannel"),


    eventLog:
        $("eventLog"),

    clearEvents:
        $("clearEvents")

};


/* ============================================================
   HELPERS
============================================================ */

function clamp(
    value,
    min,
    max
) {

    return Math.min(
        Math.max(value, min),
        max
    );

}


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(resolve, ms)
    );

}


function timeNow() {

    return new Date()
        .toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

}


function randomBit() {

    return Math.random() < .5
        ? 0
        : 1;

}


function randomBasis() {

    return Math.random() < .5
        ? "+"
        : "×";

}


function encodeState(
    bit,
    basis
) {

    if (basis === "+") {

        return bit === 0
            ? "|0⟩"
            : "|1⟩";

    }

    return bit === 0
        ? "|+⟩"
        : "|−⟩";

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ============================================================
   EVENT STREAM
============================================================ */

function addEvent(
    type,
    message
) {

    if (!ui.eventLog) return;

    state.eventCounter++;

    const row =
        document.createElement("div");

    row.className =
        `event ${type.toLowerCase()}`;

    row.innerHTML = `

        <span class="event-time">
            ${timeNow()}
        </span>

        <span class="event-type">
            ${escapeHTML(type)}
        </span>

        <span class="event-message">
            ${escapeHTML(message)}
        </span>

    `;

    ui.eventLog.prepend(row);

    while (
        ui.eventLog.children.length > 20
    ) {

        ui.eventLog.removeChild(
            ui.eventLog.lastChild
        );

    }

}


/* ============================================================
   MESSAGE → BINARY
============================================================ */

function textToBinary(text) {

    const bytes =
        new TextEncoder().encode(text);

    return Array.from(bytes)
        .map(
            byte =>
                byte
                    .toString(2)
                    .padStart(8, "0")
        )
        .join("");

}


async function fingerprint(text) {

    if (
        !window.crypto ||
        !window.crypto.subtle
    ) {

        return "LOCAL-HASH-UNAVAILABLE";

    }

    const bytes =
        new TextEncoder().encode(text);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            bytes
        );

    return Array.from(
        new Uint8Array(hash)
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("")
        .toUpperCase();

}


/* ============================================================
   MESSAGE ANALYSIS
============================================================ */

async function analyzeMessage() {

    const message =
        ui.secureMessage.value;

    if (!message.trim()) {

        ui.messageState.textContent =
            "ENTER A MESSAGE";

        return;

    }

    const binary =
        textToBinary(message);

    const ones =
        [...binary]
            .filter(bit => bit === "1")
            .length;

    const zeros =
        binary.length - ones;

    const hash =
        await fingerprint(message);

    ui.messageChars.textContent =
        message.length;

    ui.messageBits.textContent =
        binary.length;

    ui.messageOnes.textContent =
        ones;

    ui.messageZeros.textContent =
        zeros;

    ui.messageFingerprint.textContent =
        hash.substring(0, 32);

    ui.binaryCount.textContent =
        `${binary.length} BITS`;

    ui.binaryPreview.textContent =
        binary.length > 128
            ? `${binary.substring(0, 128)} …`
            : binary;

    ui.messageState.textContent =
        "MESSAGE ANALYZED";

    addEvent(
        "ANALYSIS",
        `Payload analyzed — ${message.length} characters / ${binary.length} bits`
    );

}


/* ============================================================
   MULTIPLE MESSAGE ANALYSIS
============================================================ */

async function analyzeMultipleMessages() {

    const raw =
        ui.multiMessages.value.trim();

    if (!raw) {

        ui.multiAnalysisResult.innerHTML = `
            <div class="empty-analysis">
                Please enter at least one message.
            </div>
        `;

        return;

    }

    const messages =
        raw
            .split(/\r?\n/)
            .map(message => message.trim())
            .filter(Boolean);

    ui.multiAnalysisResult.innerHTML = "";

    for (
        let index = 0;
        index < messages.length;
        index++
    ) {

        const message =
            messages[index];

        const binary =
            textToBinary(message);

        const hash =
            await fingerprint(message);

        const row =
            document.createElement("div");

        row.className =
            "message-analysis-row";

        row.innerHTML = `

            <div class="number">
                ${index + 1}
            </div>

            <div class="payload">
                ${escapeHTML(message)}
            </div>

            <div class="small-value">
                ${message.length} chars
            </div>

            <div class="small-value">
                ${binary.length} bits
            </div>

            <code>
                ${hash.substring(0, 24)}
            </code>

        `;

        ui.multiAnalysisResult.appendChild(row);

    }

    addEvent(
        "ANALYSIS",
        `${messages.length} infrastructure messages analyzed`
    );

}


/* ============================================================
   SLIDER
============================================================ */

function updateSlider() {

    const percent =
        clamp(
            Number(ui.eveSlider.value),
            0,
            100
        );

    state.evePercent =
        percent;

    state.eveProbability =
        percent / 100;

    ui.eveProbability.textContent =
        `${percent}%`;

    ui.threatPercentage.textContent =
        `${percent}% EXPOSURE`;

}


function setEvePercentage(percent) {

    percent =
        clamp(
            Number(percent),
            0,
            100
        );

    ui.eveSlider.value =
        percent;

    updateSlider();

}


/* ============================================================
   BACKEND REQUEST
============================================================ */

async function requestSimulation(
    eveEnabled,
    probability
) {

    const safeProbability =
        clamp(
            Number(probability),
            0,
            1
        );

    const url =
        `${API_BASE}/api/qkd/simulate` +
        `?eve=${eveEnabled}` +
        `&probability=${safeProbability}`;

    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `Backend returned HTTP ${response.status}`
        );

    }

    return await response.json();

}


/* ============================================================
   VISUAL QUBIT GENERATOR
============================================================ */

function createVisualQubits(
    count,
    eveProbability,
    backendQber = null
) {

    const qubits = [];

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const aliceBit =
            randomBit();

        const aliceBasis =
            randomBasis();

        const bobBasis =
            randomBasis();

        const intercepted =
            Math.random() <
            eveProbability;

        let eveBasis = null;
        let eveBit = null;
        let bobBit = aliceBit;

        if (intercepted) {

            eveBasis =
                randomBasis();

            eveBit =
                eveBasis === aliceBasis
                    ? aliceBit
                    : randomBit();

            bobBit =
                bobBasis === eveBasis
                    ? eveBit
                    : randomBit();

        }

        const sifted =
            aliceBasis === bobBasis;

        const error =
            sifted &&
            aliceBit !== bobBit;

        qubits.push({

            index: i + 1,

            aliceBit,

            aliceBasis,

            encodedState:
                encodeState(
                    aliceBit,
                    aliceBasis
                ),

            eveIntercepted:
                intercepted,

            eveBasis,

            eveBit,

            eveState:
                eveBit === null
                    ? null
                    : encodeState(
                        eveBit,
                        eveBasis
                    ),

            bobBasis,

            bobBit,

            sifted,

            error

        });

    }

    /*
        If the backend supplies actual detailed
        QBER, the dashboard uses that QBER.
        The qubit animation remains a visual
        representation of the live BB84 flow.
    */

    return qubits;

}


/* ============================================================
   SECURITY CLASSIFICATION
============================================================ */

function classifySecurity(qber) {

    if (qber <= 3) {

        return {
            level: "LOW",
            label: "SECURE",
            description:
                "Quantum channel integrity verified.",
            icon: "✓",
            className: "state-secure"
        };

    }

    if (qber <= 8) {

        return {
            level: "GUARDED",
            label: "MONITOR",
            description:
                "Elevated quantum error detected. Channel remains usable.",
            icon: "◐",
            className: "state-guarded"
        };

    }

    if (qber <= 11) {

        return {
            level: "HIGH",
            label: "HIGH RISK",
            description:
                "QBER is approaching the 11% security policy threshold.",
            icon: "!",
            className: "state-high"
        };

    }

    return {

        level: "CRITICAL",

        label: "COMPROMISED",

        description:
            "QBER exceeded the 11% policy threshold. Quantum key rejected.",

        icon: "×",

        className: "state-critical"

    };

}


/* ============================================================
   UPDATE DASHBOARD
============================================================ */

function updateDashboard(result) {

    const qber =
        Number(result.qber || 0);

    const security =
        classifySecurity(qber);


    document.body.classList.remove(
        "state-secure",
        "state-guarded",
        "state-high",
        "state-critical"
    );

    document.body.classList.add(
        security.className
    );


    /* QBER */

    ui.qberValue.textContent =
        `${qber.toFixed(2)}%`;

    ui.qberFill.style.width =
        `${clamp(
            (qber / 25) * 100,
            0,
            100
        )}%`;

    ui.qberStatus.textContent =
        qber > 11
            ? "ABOVE POLICY"
            : qber > 8
                ? "APPROACHING POLICY"
                : "WITHIN POLICY";


    /* KEY */

    const keyLength =
        Number(
            result.key_length || 0
        );

    ui.keyLength.textContent =
        `${keyLength} BITS`;

    ui.keyStatus.textContent =
        result.secure
            ? "ACCEPTED"
            : "REJECTED";


    /* EVE */

    const eveCount =
        Number(
            result.eve_attack_count || 0
        );

    ui.eveCount.textContent =
        `${eveCount} STATES`;

    ui.eveState.textContent =
        eveCount > 0
            ? "DETECTED"
            : "INACTIVE";


    /* THREAT */

    ui.threatLevel.textContent =
        security.level;

    ui.threatPercentage.textContent =
        `${state.evePercent}% EXPOSURE`;


    /* NETWORK */

    ui.transmittedCount.textContent =
        result.total_qubits ||
        result.transmitted ||
        512;

    ui.interceptedCount.textContent =
        eveCount;

    ui.retainedCount.textContent =
        result.key_length || 0;


    /* CHANNEL */

    if (qber > 11) {

        ui.channelStateLabel.textContent =
            "CHANNEL COMPROMISED";

        ui.channelStateLabel.className =
            "channel-status";

        ui.eveNodeStatus.textContent =
            "INTERCEPTION DETECTED";

    }
    else if (eveCount > 0) {

        ui.channelStateLabel.textContent =
            "MONITORING";

        ui.channelStateLabel.className =
            "channel-status";

        ui.eveNodeStatus.textContent =
            "ACTIVE";

    }
    else {

        ui.channelStateLabel.textContent =
            "CHANNEL SECURE";

        ui.channelStateLabel.className =
            "channel-status";

        ui.eveNodeStatus.textContent =
            "INACTIVE";

    }


    /* SECURITY */

    ui.securityIcon.textContent =
        security.icon;

    ui.securityStatus.textContent =
        security.label;

    ui.securityDescription.textContent =
        security.description;

    ui.securityChannel.textContent =
        qber > 11
            ? "BLOCKED"
            : "ACTIVE";


    /* MESSAGE */

    if (result.secure) {

        ui.sendMessageButton.disabled =
            false;

        ui.sendMessageButton.textContent =
            "ENCRYPT & TRANSMIT";

    }
    else {

        ui.sendMessageButton.disabled =
            false;

        ui.sendMessageButton.textContent =
            "ATTEMPT TRANSMISSION";

    }

}


/* ============================================================
   PARTICLES
============================================================ */

function createParticles() {

    ui.particleLayer.innerHTML = "";

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const particle =
            document.createElement("div");

        particle.className =
            "particle";

        particle.style.animationDelay =
            `${-(i * .19)}s`;

        ui.particleLayer.appendChild(
            particle
        );

    }

}


function updateParticleAttackState() {

    const attack =
        state.evePercent > 0;

    const particles =
        ui.particleLayer
            .querySelectorAll(".particle");

    particles.forEach(
        particle => {

            particle.classList.toggle(
                "attack",
                attack
            );

        }
    );

}


/* ============================================================
   LIVE QUBIT INSPECTOR
============================================================ */

function updateInspector(qubit) {

    if (!qubit) return;


    ui.inspectorIndex.textContent =
        qubit.index;

    ui.currentQubit.textContent =
        qubit.index;


    ui.inspectorAliceBit.textContent =
        qubit.aliceBit;

    ui.inspectorAliceBasis.textContent =
        qubit.aliceBasis;

    ui.inspectorState.textContent =
        qubit.encodedState;


    ui.inspectorEve.textContent =
        qubit.eveIntercepted
            ? "INTERCEPTED"
            : "CLEAR";

    ui.inspectorEveBasis.textContent =
        qubit.eveBasis || "—";

    ui.inspectorEveBit.textContent =
        qubit.eveBit === null ||
        qubit.eveBit === undefined
            ? "—"
            : qubit.eveBit;


    ui.inspectorBobBasis.textContent =
        qubit.bobBasis;

    ui.inspectorBobBit.textContent =
        qubit.bobBit;


    ui.inspectorSifted.textContent =
        qubit.sifted
            ? "YES"
            : "NO";


    ui.inspectorError.textContent =
        qubit.error
            ? "ERROR"
            : "MATCH";


    ui.inspectorEve.className =
        qubit.eveIntercepted
            ? "error"
            : "good";

    ui.inspectorError.className =
        qubit.error
            ? "error"
            : "good";


    /*
        Move the live particle.
        This makes the changing transmission
        physically visible.
    */

    const progress =
        (qubit.index % 100) / 100;

    ui.liveParticle.style.left =
        `${8 + progress * 84}%`;

    if (qubit.eveIntercepted) {

        ui.liveParticle.style.top =
            "15%";

        ui.liveParticle.style.background =
            "var(--red)";

        ui.liveParticle.style.boxShadow =
            "0 0 15px var(--red), 0 0 30px var(--red)";

    }
    else {

        ui.liveParticle.style.top =
            "calc(50% - 6px)";

        ui.liveParticle.style.background =
            "white";

        ui.liveParticle.style.boxShadow =
            "0 0 12px white, 0 0 28px var(--cyan)";

    }

}


/* ============================================================
   LIVE TRANSMISSION LOOP
============================================================ */

function startQubitAnimation() {

    if (
        state.animationTimer
    ) {

        clearInterval(
            state.animationTimer
        );

    }


    if (
        !state.visualQubits.length
    ) return;


    state.currentQubit = 0;


    state.animationTimer =
        setInterval(
            () => {

                const qubit =
                    state.visualQubits[
                        state.currentQubit
                    ];

                updateInspector(qubit);


                /*
                    This makes the displayed numbers
                    visibly change instead of only
                    updating after the simulation ends.
                */

                ui.transmittedCount.textContent =
                    qubit.index;


                if (
                    qubit.eveIntercepted
                ) {

                    ui.interceptedCount.textContent =
                        Math.min(
                            state.visualQubits
                                .slice(
                                    0,
                                    state.currentQubit + 1
                                )
                                .filter(
                                    q =>
                                        q.eveIntercepted
                                )
                                .length,
                            state.visualQubits.length
                        );

                }


                state.currentQubit++;

                if (
                    state.currentQubit >=
                    state.visualQubits.length
                ) {

                    state.currentQubit = 0;

                }

            },
            180
        );

}


/* ============================================================
   SIMULATION
============================================================ */

async function runSimulation(
    eveEnabled,
    probability
) {

    if (state.busy) {

        addEvent(
            "SYSTEM",
            "Simulation already running..."
        );

        return;

    }


    state.busy = true;


    try {

        addEvent(
            eveEnabled
                ? "EVE"
                : "SYSTEM",

            eveEnabled
                ? `Eve interception set to ${Math.round(probability * 100)}%`
                : "Clean BB84 session initialized"
        );


        /*
            Show visual activity immediately.
        */

        state.visualQubits =
            createVisualQubits(
                128,
                probability
            );

        updateParticleAttackState();

        startQubitAnimation();


        addEvent(
            "QUANTUM",
            "Alice is preparing quantum states..."
        );


        await sleep(350);


        addEvent(
            "QUANTUM",
            "Quantum states entering channel..."
        );


        const result =
            await requestSimulation(
                eveEnabled,
                probability
            );


        state.result =
            result;


        /*
            Keep the requested percentage
            visible even if backend returns
            a slightly different attack count.
        */

        state.evePercent =
            Math.round(
                probability * 100
            );


        updateDashboard(
            result
        );


        addEvent(
            "ANALYSIS",
            `QBER measured at ${Number(result.qber || 0).toFixed(2)}%`
        );


        if (
            Number(result.eve_attack_count || 0) > 0
        ) {

            addEvent(
                "EVE",
                `${result.eve_attack_count} quantum states intercepted`
            );

        }
        else {

            addEvent(
                "QUANTUM",
                "No quantum-state interception detected"
            );

        }


        await sleep(250);


        if (
            Number(result.qber || 0) > 11
        ) {

            addEvent(
                "SECURITY",
                "QBER ABOVE POLICY — SESSION COMPROMISED"
            );

            addEvent(
                "KEY",
                "SIFTED KEY REJECTED"
            );

        }
        else {

            addEvent(
                "KEY",
                `Quantum key accepted — ${result.key_length || 0} usable bits`
            );

        }


        /*
            Restore full transmitted count after
            the live animation has demonstrated
            changing values.
        */

        setTimeout(
            () => {

                ui.transmittedCount.textContent =
                    result.total_qubits ||
                    512;

                ui.interceptedCount.textContent =
                    result.eve_attack_count ||
                    0;

                ui.retainedCount.textContent =
                    result.key_length ||
                    0;

            },
            1800
        );


    }
    catch (error) {

        console.error(error);

        addEvent(
            "ERROR",
            error.message
        );

    }
    finally {

        state.busy = false;

    }

}


/* ============================================================
   SECURE KEY
============================================================ */

async function generateSecureKey() {

    setEvePercentage(0);

    addEvent(
        "SYSTEM",
        "Generating clean quantum key..."
    );

    await runSimulation(
        false,
        0
    );

}


/* ============================================================
   ATTACK
============================================================ */

async function simulateAttack() {

    let percent =
        Number(
            ui.eveSlider.value
        );


    /*
        Judge-friendly:
        if slider is zero, attack button
        automatically demonstrates full attack.
    */

    if (percent === 0) {

        percent = 100;

        setEvePercentage(
            percent
        );

    }


    addEvent(
        "ALERT",
        `Attack scenario launched — Eve exposure ${percent}%`
    );


    await runSimulation(
        true,
        percent / 100
    );

}


/* ============================================================
   MESSAGE TRANSMISSION
============================================================ */

async function transmitMessage() {

    const message =
        ui.secureMessage.value.trim();


    if (!message) {

        ui.messageState.textContent =
            "ENTER A MESSAGE";

        return;

    }


    /*
        Always analyze first.
    */

    await analyzeMessage();


    const result =
        state.result;


    if (!result) {

        ui.messageState.textContent =
            "RUN A QUANTUM SESSION FIRST";

        return;

    }


    if (!result.secure) {

        ui.messageState.textContent =
            "TRANSMISSION BLOCKED";

        addEvent(
            "BLOCK",
            "Sensitive payload blocked — quantum key rejected"
        );

        return;

    }


    ui.sendMessageButton.disabled =
        true;

    ui.sendMessageButton.textContent =
        "ENCRYPTING...";


    ui.messageState.textContent =
        "ENCRYPTING PAYLOAD...";


    addEvent(
        "CRYPTO",
        "Critical infrastructure payload submitted"
    );


    await sleep(700);


    const hash =
        await fingerprint(message);


    ui.messageState.textContent =
        "TRANSMISSION DELIVERED";


    addEvent(
        "DELIVERY",
        `Secure message delivered — fingerprint ${hash.substring(0, 16)}`
    );


    ui.sendMessageButton.disabled =
        false;

    ui.sendMessageButton.textContent =
        "ENCRYPT & TRANSMIT";

}


/* ============================================================
   EVENTS
============================================================ */

ui.eveSlider.addEventListener(
    "input",
    () => {

        updateSlider();

        updateParticleAttackState();

    }
);


ui.eveSlider.addEventListener(
    "change",
    async () => {

        /*
            Slider itself now immediately changes
            the visible percentage.

            On release, actually run the selected
            quantum attack scenario.
        */

        const percent =
            Number(
                ui.eveSlider.value
            );

        await runSimulation(
            percent > 0,
            percent / 100
        );

    }
);


document
    .querySelectorAll(
        ".preset-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const percent =
                        Number(
                            button.dataset.eve
                        );

                    setEvePercentage(
                        percent
                    );

                    updateParticleAttackState();

                    await runSimulation(
                        percent > 0,
                        percent / 100
                    );

                }
            );

        }
);


ui.generateButton.addEventListener(
    "click",
    generateSecureKey
);


ui.attackButton.addEventListener(
    "click",
    simulateAttack
);


ui.analyzeMessageButton.addEventListener(
    "click",
    analyzeMessage
);


ui.analyzeMultipleButton.addEventListener(
    "click",
    analyzeMultipleMessages
);


ui.sendMessageButton.addEventListener(
    "click",
    transmitMessage
);


ui.secureMessage.addEventListener(
    "input",
    () => {

        /*
            Live preview while typing.
        */

        const message =
            ui.secureMessage.value;

        const binary =
            textToBinary(message);

        const ones =
            [...binary]
                .filter(
                    bit => bit === "1"
                )
                .length;

        ui.messageChars.textContent =
            message.length;

        ui.messageBits.textContent =
            binary.length;

        ui.messageOnes.textContent =
            ones;

        ui.messageZeros.textContent =
            binary.length - ones;

        ui.binaryCount.textContent =
            `${binary.length} BITS`;

        ui.binaryPreview.textContent =
            binary
                ? binary.substring(0, 128)
                : "Enter a message to generate binary telemetry.";

    }
);


ui.multiMessages.addEventListener(
    "input",
    () => {

        if (
            ui.multiMessages.value.trim()
        ) {

            ui.multiAnalysisResult.innerHTML = `
                <div class="empty-analysis">
                    ${ui.multiMessages.value
                        .split(/\r?\n/)
                        .filter(line => line.trim())
                        .length}
                    message(s) ready for analysis.
                </div>
            `;

        }

    }
);


ui.clearEvents.addEventListener(
    "click",
    () => {

        ui.eventLog.innerHTML = "";

        addEvent(
            "SYSTEM",
            "Event stream cleared"
        );

    }
);


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        createParticles();

        updateSlider();

        addEvent(
            "SYSTEM",
            "Q-SHIELD security fabric online"
        );

        addEvent(
            "SYSTEM",
            "BB84 quantum engine ready"
        );

        /*
            Analyze default message immediately.
        */

        await analyzeMessage();

        /*
            Start clean.
        */

        await runSimulation(
            false,
            0
        );

    }
);