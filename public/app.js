/**
 * MindChain Application Logic
 * Integrates Web3 / Ethers.js, Client-side AES encryption, and Chart.js analytics.
 */

// Global Application State
const state = {
    isLiveWeb3: false,
    provider: null,
    signer: null,
    contract: null,
    contractData: null,
    userAccount: null,
    currentRole: 'patient',
    activeTab: 'tab-checkin',
    entries: [],
    authorizedTherapists: [],
    chart: null,
    therapistChart: null,
    // Demo accounts for instant presentation
    demoAccounts: {
        patient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        therapist: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    }
};

// Emoji map for mood scores
const MOOD_EMOJIS = {
    1: '😭', 2: '😢', 3: '😟', 4: '🙁', 5: '😐',
    6: '🙂', 7: '😊', 8: '😃', 9: '😁', 10: '🌟'
};

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    setupTabNavigation();
    setupSliderListeners();
    setupRoleSwitcher();
    await loadContractMetadata();
    await initWeb3OrSimulator();
});

// Setup tab clicking
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const pane = document.getElementById(targetId);
            if (pane) pane.classList.add('active');
            state.activeTab = targetId;

            if (targetId === 'tab-analytics') {
                renderAnalyticsView();
            } else if (targetId === 'tab-consent') {
                renderConsentView();
            }
        });
    });
}

// Sliders and dynamic visual feedback
function setupSliderListeners() {
    const moodSlider = document.getElementById('moodSlider');
    const anxietySlider = document.getElementById('anxietySlider');
    if (moodSlider) updateMoodDisplay(moodSlider.value);
    if (anxietySlider) updateAnxietyDisplay(anxietySlider.value);
}

function updateMoodDisplay(val) {
    const moodNum = document.getElementById('moodNumber');
    const moodEmoji = document.getElementById('moodEmoji');
    if (moodNum) moodNum.textContent = val;
    if (moodEmoji) moodEmoji.textContent = MOOD_EMOJIS[val] || '🙂';
}

function updateAnxietyDisplay(val) {
    const anxNum = document.getElementById('anxietyNumber');
    if (anxNum) anxNum.textContent = val;
}

function togglePassphraseVisibility() {
    const passInput = document.getElementById('encryptionKey');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Role switch between patient and therapist
function setupRoleSwitcher() {
    const roleSelect = document.getElementById('roleSwitcher');
    if (!roleSelect) return;

    roleSelect.addEventListener('change', async (e) => {
        state.currentRole = e.target.value;
        if (!state.isLiveWeb3) {
            // Update demo account
            state.userAccount = state.demoAccounts[state.currentRole];
            updateWalletUI(state.userAccount);
            showToast(`Switched active role to: ${state.currentRole.toUpperCase()}`, 'info');
            await refreshEntries();
        }
    });
}

// -------------------------------------------------------------
// Web3 & Contract Connection
// -------------------------------------------------------------
async function loadContractMetadata() {
    try {
        const res = await fetch('contractData.json');
        if (res.ok) {
            state.contractData = await res.json();
            const addrDisplay = document.getElementById('contractAddressDisplay');
            if (addrDisplay && state.contractData.address) {
                addrDisplay.textContent = state.contractData.address;
            }
        }
    } catch (err) {
        console.warn('Could not load contractData.json, using fallback simulator.', err);
    }
}

async function initWeb3OrSimulator() {
    const modeBadge = document.getElementById('modeBadge');
    const modeText = document.getElementById('modeText');
    const connectBtn = document.getElementById('connectWalletBtn');

    // Check if MetaMask / window.ethereum exists
    if (window.ethereum) {
        try {
            state.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await state.provider.listAccounts();
            if (accounts.length > 0) {
                state.signer = await state.provider.getSigner();
                state.userAccount = await state.signer.getAddress();
                state.isLiveWeb3 = true;
                setupContractInstance();
            }
        } catch (err) {
            console.log('User not yet connected via MetaMask, falling back to simulator until connected.');
        }
    }

    if (state.isLiveWeb3 && state.userAccount) {
        modeText.textContent = 'Live Web3 (EVM)';
        modeBadge.querySelector('.status-dot').className = 'status-dot online';
        updateWalletUI(state.userAccount);
        await refreshEntries();
    } else {
        // Fallback to seamless instant simulator
        enableSimulatorMode();
    }

    connectBtn.addEventListener('click', handleConnectWalletClick);
}

function enableSimulatorMode() {
    state.isLiveWeb3 = false;
    state.userAccount = state.demoAccounts[state.currentRole];

    const modeText = document.getElementById('modeText');
    const modeBadge = document.getElementById('modeBadge');
    if (modeText) modeText.textContent = 'Interactive Simulator Mode';
    if (modeBadge) modeBadge.querySelector('.status-dot').className = 'status-dot simulated';

    // Seed mock data if empty
    seedSimulatedDataIfEmpty();
    updateWalletUI(state.userAccount);
    refreshEntries();
}

function setupContractInstance() {
    if (!state.contractData || !state.contractData.address || !state.signer) return;
    try {
        state.contract = new ethers.Contract(
            state.contractData.address,
            state.contractData.abi,
            state.signer
        );
        console.log('Contract instance initialized at:', state.contractData.address);
    } catch (err) {
        console.error('Failed to instantiate ethers contract:', err);
    }
}

async function handleConnectWalletClick() {
    if (window.ethereum) {
        try {
            state.provider = new ethers.BrowserProvider(window.ethereum);
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            state.signer = await state.provider.getSigner();
            state.userAccount = await state.signer.getAddress();
            state.isLiveWeb3 = true;

            const modeText = document.getElementById('modeText');
            const modeBadge = document.getElementById('modeBadge');
            modeText.textContent = 'Connected (MetaMask)';
            modeBadge.querySelector('.status-dot').className = 'status-dot online';

            setupContractInstance();
            updateWalletUI(state.userAccount);
            showToast('Connected to MetaMask: ' + truncateAddress(state.userAccount), 'success');
            await refreshEntries();
        } catch (err) {
            showToast('MetaMask connection rejected or failed: ' + err.message, 'error');
        }
    } else {
        showToast('MetaMask extension not found. Running in high-fidelity simulator mode!', 'info');
    }
}

function updateWalletUI(address) {
    const walletText = document.getElementById('walletAddressText');
    if (walletText) {
        walletText.textContent = truncateAddress(address);
    }
}

function truncateAddress(addr) {
    if (!addr) return 'Not Connected';
    return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
}

// -------------------------------------------------------------
// AES Client-Side Encryption
// -------------------------------------------------------------
function encryptJournalNote(cleartext, passphrase) {
    if (!cleartext || !cleartext.trim()) return '';
    try {
        return CryptoJS.AES.encrypt(cleartext.trim(), passphrase).toString();
    } catch (err) {
        console.error('Encryption failed:', err);
        return cleartext;
    }
}

function decryptJournalNote(ciphertext, passphrase) {
    if (!ciphertext) return 'No note recorded';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || '[Decryption failed: Incorrect passphrase]';
    } catch (err) {
        return '[Decryption error: Invalid key]';
    }
}

// -------------------------------------------------------------
// Entry Submission & Retrieval
// -------------------------------------------------------------
async function handleCheckinSubmit(e) {
    e.preventDefault();

    const moodScore = parseInt(document.getElementById('moodSlider').value);
    const anxietyScore = parseInt(document.getElementById('anxietySlider').value);
    const sleepHours = parseInt(document.getElementById('sleepInput').value);
    const activityTag = document.getElementById('activityTag').value;
    const noteText = document.getElementById('journalNote').value;
    const passphrase = document.getElementById('encryptionKey').value || 'mindchain-default-key';

    // Client-side encryption
    const encryptedNote = encryptJournalNote(noteText, passphrase);
    const isCrisis = (moodScore <= 2 && anxietyScore >= 8);

    const submitBtn = document.getElementById('submitCheckinBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting to Blockchain...';

    try {
        if (state.isLiveWeb3 && state.contract) {
            // Live Smart Contract Call
            const tx = await state.contract.logMoodEntry(
                moodScore,
                anxietyScore,
                sleepHours,
                activityTag,
                encryptedNote
            );
            showToast('Transaction submitted: ' + tx.hash.substring(0, 10) + '...', 'info');
            await tx.wait();
            showToast('Check-in confirmed on Ethereum block!', 'success');
        } else {
            // Simulated Blockchain State
            await simulatedDelay(600);
            saveSimulatedEntry({
                patient: state.userAccount,
                timestamp: Math.floor(Date.now() / 1000),
                moodScore,
                anxietyScore,
                sleepHours,
                activityTag,
                encryptedNote,
                isCrisis
            });
            showToast('Check-in committed to tamper-proof block!', 'success');
        }

        // Show crisis alert banner if distress detected
        if (isCrisis) {
            showCrisisBanner();
        }

        // Reset form note
        document.getElementById('journalNote').value = '';
        await refreshEntries();

    } catch (err) {
        console.error('Error submitting check-in:', err);
        showToast('Submission error: ' + (err.reason || err.message), 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Commit Entry to Blockchain';
    }
}

async function refreshEntries() {
    try {
        if (state.isLiveWeb3 && state.contract) {
            const rawEntries = await state.contract.getMyEntries();
            state.entries = rawEntries.map(e => ({
                id: Number(e.id),
                timestamp: Number(e.timestamp),
                moodScore: Number(e.moodScore),
                anxietyScore: Number(e.anxietyScore),
                sleepHours: Number(e.sleepHours),
                activityTag: e.activityTag,
                encryptedNote: e.encryptedNote,
                isCrisis: e.isCrisis
            }));

            const auths = await state.contract.getMyAuthorizedTherapists();
            state.authorizedTherapists = auths;
        } else {
            // Simulator read
            state.entries = getSimulatedEntries(state.userAccount);
            state.authorizedTherapists = getSimulatedAuthorizedTherapists(state.userAccount);
        }

        // Update badges
        const countBadge = document.getElementById('userEntryCountBadge');
        if (countBadge) countBadge.textContent = `${state.entries.length} logged`;

        // Render current active tab if relevant
        if (state.activeTab === 'tab-analytics') {
            renderAnalyticsView();
        } else if (state.activeTab === 'tab-consent') {
            renderConsentView();
        }

    } catch (err) {
        console.warn('Failed to refresh entries:', err);
    }
}

// -------------------------------------------------------------
// Analytics & Chart Rendering
// -------------------------------------------------------------
function renderAnalyticsView() {
    const totalCount = state.entries.length;
    document.getElementById('statTotalCheckins').textContent = totalCount;

    if (totalCount === 0) {
        document.getElementById('statAvgMood').textContent = '-';
        document.getElementById('statAvgAnxiety').textContent = '-';
        document.getElementById('statAvgSleep').textContent = '-';
        renderEntriesList([]);
        return;
    }

    const avgMood = (state.entries.reduce((acc, curr) => acc + curr.moodScore, 0) / totalCount).toFixed(1);
    const avgAnxiety = (state.entries.reduce((acc, curr) => acc + curr.anxietyScore, 0) / totalCount).toFixed(1);
    const avgSleep = (state.entries.reduce((acc, curr) => acc + curr.sleepHours, 0) / totalCount).toFixed(1);

    document.getElementById('statAvgMood').textContent = `${avgMood} / 10`;
    document.getElementById('statAvgAnxiety').textContent = `${avgAnxiety} / 10`;
    document.getElementById('statAvgSleep').textContent = `${avgSleep} hrs`;

    // Render Timeline Chart
    renderChart(state.entries);

    // Render List of Cards
    renderEntriesList(state.entries);
}

function renderChart(entries) {
    const ctx = document.getElementById('wellnessChart');
    if (!ctx) return;

    if (state.chart) {
        state.chart.destroy();
    }

    // Sort by timestamp ascending for chronological chart
    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    const labels = sorted.map((e, idx) => {
        const d = new Date(e.timestamp * 1000);
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} #${idx + 1}`;
    });

    const moodData = sorted.map(e => e.moodScore);
    const anxietyData = sorted.map(e => e.anxietyScore);
    const sleepData = sorted.map(e => e.sleepHours);

    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Mood Score (1-10)',
                    data: moodData,
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.12)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 3,
                    pointBackgroundColor: '#0d9488',
                    pointRadius: 5
                },
                {
                    label: 'Anxiety Level (1-10)',
                    data: anxietyData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                    borderDash: [5, 5]
                },
                {
                    label: 'Sleep Duration (hrs)',
                    data: sleepData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.2,
                    borderWidth: 2,
                    pointBackgroundColor: '#f59e0b',
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    min: 0,
                    max: 12,
                    ticks: { stepSize: 2 }
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        afterLabel: function(ctx) {
                            if (ctx.datasetIndex === 0) {
                                const score = ctx.parsed.y;
                                return 'Status: ' + (score >= 8 ? 'Thriving' : score >= 5 ? 'Stable' : 'Distressed');
                            }
                        }
                    }
                }
            }
        }
    });
}

function renderEntriesList(entries) {
    const container = document.getElementById('entriesListContainer');
    if (!container) return;

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-feather empty-icon"></i>
                <p>No mood logs found. Log your first check-in to see verified on-chain records!</p>
            </div>
        `;
        return;
    }

    // Sort descending for recent items first
    const descending = [...entries].sort((a, b) => b.timestamp - a.timestamp);

    container.innerHTML = descending.map((entry, index) => {
        const dateStr = new Date(entry.timestamp * 1000).toLocaleString();
        const emoji = MOOD_EMOJIS[entry.moodScore] || '🙂';
        const crisisClass = entry.isCrisis ? 'crisis' : '';
        const crisisBadge = entry.isCrisis ? '<span class="badge badge-red"><i class="fa-solid fa-triangle-exclamation"></i> Crisis Flagged</span>' : '';

        return `
            <div class="entry-item ${crisisClass}">
                <div class="entry-top">
                    <div class="entry-badges">
                        <span class="badge badge-teal">${emoji} Mood: ${entry.moodScore}/10</span>
                        <span class="badge badge-purple">Anxiety: ${entry.anxietyScore}/10</span>
                        <span class="badge badge-amber"><i class="fa-solid fa-bed"></i> ${entry.sleepHours}h Sleep</span>
                        ${crisisBadge}
                    </div>
                    <span class="entry-date"><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                </div>

                <div class="entry-details">
                    <span><strong>Context:</strong> ${escapeHtml(entry.activityTag)}</span>
                    <span class="mono" style="font-size: 0.72rem; color: #64748b;">Block Time: ${entry.timestamp}</span>
                </div>

                <div class="entry-note-box" id="noteBox-${index}">
                    <strong><i class="fa-solid fa-lock"></i> Encrypted Note Ciphertext:</strong>
                    <div class="mono" style="word-break: break-all; margin-top: 4px;">
                        ${escapeHtml(entry.encryptedNote || 'No private note')}
                    </div>
                    ${entry.encryptedNote ? `
                        <button class="btn-decrypt" onclick="handleDecryptClick('${index}', '${encodeURIComponent(entry.encryptedNote)}')">
                            <i class="fa-solid fa-unlock-keyhole"></i> Decrypt with Passphrase
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function handleDecryptClick(index, encodedCiphertext) {
    const ciphertext = decodeURIComponent(encodedCiphertext);
    const pass = prompt('Enter your personal encryption passphrase:');
    if (pass === null) return;

    const cleartext = decryptJournalNote(ciphertext, pass);
    const targetBox = document.getElementById(`noteBox-${index}`);
    if (targetBox) {
        targetBox.innerHTML = `
            <strong><i class="fa-solid fa-lock-open text-teal"></i> Decrypted Note:</strong>
            <p style="margin-top: 6px; font-size: 0.88rem; color: #0f172a; font-style: italic;">
                "${escapeHtml(cleartext)}"
            </p>
        `;
    }
}

// -------------------------------------------------------------
// Therapist Consent Management
// -------------------------------------------------------------
function renderConsentView() {
    const listContainer = document.getElementById('authorizedTherapistsList');
    if (!listContainer) return;

    if (state.authorizedTherapists.length === 0) {
        listContainer.innerHTML = '<p class="empty-text">No therapists currently authorized. Your logs are completely private.</p>';
        return;
    }

    listContainer.innerHTML = state.authorizedTherapists.map(addr => `
        <div class="therapist-row">
            <div>
                <i class="fa-solid fa-user-doctor text-teal"></i>
                <span class="mono" style="margin-left: 0.5rem;">${addr}</span>
            </div>
            <button class="btn-revoke" onclick="handleRevokeTherapist('${addr}')">
                <i class="fa-solid fa-user-minus"></i> Revoke Access
            </button>
        </div>
    `).join('');
}

async function handleAuthorizeTherapist(e) {
    e.preventDefault();
    const addrInput = document.getElementById('therapistAddressInput');
    const therapistAddr = addrInput.value.trim();

    if (!ethers.isAddress(therapistAddr)) {
        showToast('Please enter a valid Ethereum address (0x...)', 'error');
        return;
    }

    try {
        if (state.isLiveWeb3 && state.contract) {
            const tx = await state.contract.authorizeTherapist(therapistAddr);
            showToast('Authorization transaction sent...', 'info');
            await tx.wait();
            showToast('Therapist authorized on smart contract!', 'success');
        } else {
            await simulatedDelay(400);
            addSimulatedTherapist(state.userAccount, therapistAddr);
            showToast('Therapist granted access in smart contract!', 'success');
        }

        addrInput.value = '';
        await refreshEntries();
    } catch (err) {
        showToast('Authorization error: ' + (err.reason || err.message), 'error');
    }
}

async function handleRevokeTherapist(therapistAddr) {
    if (!confirm(`Are you sure you want to revoke access for ${therapistAddr}?`)) return;

    try {
        if (state.isLiveWeb3 && state.contract) {
            const tx = await state.contract.revokeTherapist(therapistAddr);
            showToast('Revocation transaction sent...', 'info');
            await tx.wait();
            showToast('Therapist access revoked!', 'success');
        } else {
            await simulatedDelay(400);
            removeSimulatedTherapist(state.userAccount, therapistAddr);
            showToast('Therapist access revoked!', 'success');
        }

        await refreshEntries();
    } catch (err) {
        showToast('Revocation error: ' + (err.reason || err.message), 'error');
    }
}

// -------------------------------------------------------------
// Therapist Clinical Portal
// -------------------------------------------------------------
async function lookupPatientRecords() {
    const input = document.getElementById('lookupPatientAddress');
    const patientAddr = input.value.trim();

    if (!ethers.isAddress(patientAddr)) {
        showToast('Please enter a valid patient Ethereum address.', 'error');
        return;
    }

    const notice = document.getElementById('therapistStatusNotice');
    const reviewArea = document.getElementById('patientReviewArea');
    notice.classList.remove('hidden', 'authorized', 'unauthorized');
    reviewArea.classList.add('hidden');

    notice.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking on-chain authorization...';

    try {
        let isAuthorized = false;
        let entries = [];

        if (state.isLiveWeb3 && state.contract) {
            // Live contract call
            try {
                const rawEntries = await state.contract.getPatientEntries(patientAddr);
                isAuthorized = true;
                entries = rawEntries.map(e => ({
                    id: Number(e.id),
                    timestamp: Number(e.timestamp),
                    moodScore: Number(e.moodScore),
                    anxietyScore: Number(e.anxietyScore),
                    sleepHours: Number(e.sleepHours),
                    activityTag: e.activityTag,
                    encryptedNote: e.encryptedNote,
                    isCrisis: e.isCrisis
                }));
            } catch (err) {
                isAuthorized = false;
            }
        } else {
            // Simulator check
            await simulatedDelay(500);
            isAuthorized = checkSimulatedAccess(patientAddr, state.userAccount);
            if (isAuthorized) {
                entries = getSimulatedEntries(patientAddr);
            }
        }

        if (!isAuthorized) {
            notice.className = 'therapist-notice unauthorized';
            notice.innerHTML = `
                <strong><i class="fa-solid fa-lock"></i> Smart Contract Access Denied:</strong>
                Your address (${truncateAddress(state.userAccount)}) has NOT been authorized by patient ${truncateAddress(patientAddr)}.
                Records cannot be decrypted or viewed without patient consent.
            `;
            return;
        }

        // Access Granted!
        notice.className = 'therapist-notice authorized';
        notice.innerHTML = `
            <strong><i class="fa-solid fa-circle-check"></i> Authorized Access Confirmed:</strong>
            Smart contract verified valid therapeutic consent for patient <code>${patientAddr}</code>.
        `;

        reviewArea.classList.remove('hidden');
        document.getElementById('patientReviewCountBadge').textContent = `${entries.length} Verified Entries`;

        // Render Therapist Chart
        renderTherapistChart(entries);

        // Render Patient entries in therapist view
        const listEl = document.getElementById('patientEntriesList');
        if (entries.length === 0) {
            listEl.innerHTML = '<p class="empty-state">Patient has not logged any check-ins yet.</p>';
        } else {
            const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
            listEl.innerHTML = sorted.map((entry, idx) => {
                const d = new Date(entry.timestamp * 1000).toLocaleString();
                const crisisBadge = entry.isCrisis ? '<span class="badge badge-red"><i class="fa-solid fa-triangle-exclamation"></i> Crisis Flagged</span>' : '';
                return `
                    <div class="entry-item ${entry.isCrisis ? 'crisis' : ''}">
                        <div class="entry-top">
                            <div class="entry-badges">
                                <span class="badge badge-teal">Mood: ${entry.moodScore}/10</span>
                                <span class="badge badge-purple">Anxiety: ${entry.anxietyScore}/10</span>
                                <span class="badge badge-amber">${entry.sleepHours}h Sleep</span>
                                ${crisisBadge}
                            </div>
                            <span class="entry-date">${d}</span>
                        </div>
                        <div class="entry-details">
                            <span><strong>Context:</strong> ${escapeHtml(entry.activityTag)}</span>
                        </div>
                        <div class="entry-note-box" id="therapistNoteBox-${idx}">
                            <strong>Encrypted Patient Reflection:</strong>
                            <div class="mono" style="word-break: break-all; margin-top: 4px;">
                                ${escapeHtml(entry.encryptedNote)}
                            </div>
                            <button class="btn-decrypt" onclick="handleDecryptClick('therapist-${idx}', '${encodeURIComponent(entry.encryptedNote)}')">
                                <i class="fa-solid fa-key"></i> Decrypt with Shared Patient Key
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

    } catch (err) {
        notice.className = 'therapist-notice unauthorized';
        notice.innerHTML = 'Error querying patient records: ' + err.message;
    }
}

function renderTherapistChart(entries) {
    const ctx = document.getElementById('therapistPatientChart');
    if (!ctx) return;

    if (state.therapistChart) {
        state.therapistChart.destroy();
    }

    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    const labels = sorted.map((e, idx) => {
        const d = new Date(e.timestamp * 1000);
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} #${idx + 1}`;
    });

    state.therapistChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Clinical Mood Score',
                    data: sorted.map(e => e.moodScore),
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.15)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Clinical Anxiety Score',
                    data: sorted.map(e => e.anxietyScore),
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    tension: 0.3,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { min: 0, max: 10 } }
        }
    });
}

// -------------------------------------------------------------
// 4-7-8 Breathing Exercise
// -------------------------------------------------------------
let breathingInterval = null;
let isBreathingActive = false;

function toggleBreathingExercise() {
    const btn = document.getElementById('startBreathingBtn');
    if (isBreathingActive) {
        stopBreathing();
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start Guided Breathing';
    } else {
        startBreathing();
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Exercise';
    }
}

function startBreathing() {
    isBreathingActive = true;
    const circle = document.getElementById('breathingCircle');
    const instruction = document.getElementById('breathingInstruction');
    const timer = document.getElementById('breathingTimer');

    function runCycle() {
        if (!isBreathingActive) return;

        // Step 1: Inhale 4s
        circle.className = 'breathing-circle inhale';
        instruction.textContent = 'Inhale deeply';
        let t = 4;
        timer.textContent = t;

        const inhaleTimer = setInterval(() => {
            if (!isBreathingActive) { clearInterval(inhaleTimer); return; }
            t--;
            if (t > 0) {
                timer.textContent = t;
            } else {
                clearInterval(inhaleTimer);

                // Step 2: Hold 7s
                circle.className = 'breathing-circle hold';
                instruction.textContent = 'Hold breath';
                let holdT = 7;
                timer.textContent = holdT;

                const holdTimer = setInterval(() => {
                    if (!isBreathingActive) { clearInterval(holdTimer); return; }
                    holdT--;
                    if (holdT > 0) {
                        timer.textContent = holdT;
                    } else {
                        clearInterval(holdTimer);

                        // Step 3: Exhale 8s
                        circle.className = 'breathing-circle exhale';
                        instruction.textContent = 'Exhale gently';
                        let exT = 8;
                        timer.textContent = exT;

                        const exhaleTimer = setInterval(() => {
                            if (!isBreathingActive) { clearInterval(exhaleTimer); return; }
                            exT--;
                            if (exT > 0) {
                                timer.textContent = exT;
                            } else {
                                clearInterval(exhaleTimer);
                                // Loop
                                if (isBreathingActive) runCycle();
                            }
                        }, 1000);
                    }
                }, 1000);
            }
        }, 1000);
    }

    runCycle();
}

function stopBreathing() {
    isBreathingActive = false;
    const circle = document.getElementById('breathingCircle');
    const instruction = document.getElementById('breathingInstruction');
    const timer = document.getElementById('breathingTimer');

    circle.className = 'breathing-circle';
    instruction.textContent = 'Inhale';
    timer.textContent = '4';
}

// -------------------------------------------------------------
// Crisis Banner & Notifications
// -------------------------------------------------------------
function showCrisisBanner() {
    const banner = document.getElementById('crisisBanner');
    if (banner) banner.classList.remove('hidden');
}

function dismissCrisisBanner() {
    const banner = document.getElementById('crisisBanner');
    if (banner) banner.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'circle-check' : type === 'error' ? 'circle-exclamation' : 'circle-info';
    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

function simulatedDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------------------------------------------------
// Local Simulated Storage (Zero-friction demo)
// -------------------------------------------------------------
const SIM_STORAGE_KEY = 'mindchain_sim_v1';

function getSimulatedDB() {
    try {
        const data = localStorage.getItem(SIM_STORAGE_KEY);
        return data ? JSON.parse(data) : { entries: {}, consents: {} };
    } catch (e) {
        return { entries: {}, consents: {} };
    }
}

function saveSimulatedDB(db) {
    try {
        localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
        console.warn('Storage save failed:', e);
    }
}

function saveSimulatedEntry(entry) {
    const db = getSimulatedDB();
    const patientKey = entry.patient.toLowerCase();
    if (!db.entries[patientKey]) db.entries[patientKey] = [];
    entry.id = db.entries[patientKey].length + 1;
    db.entries[patientKey].push(entry);
    saveSimulatedDB(db);
}

function getSimulatedEntries(patientAddress) {
    if (!patientAddress) return [];
    const db = getSimulatedDB();
    return db.entries[patientAddress.toLowerCase()] || [];
}

function addSimulatedTherapist(patientAddress, therapistAddress) {
    const db = getSimulatedDB();
    const pKey = patientAddress.toLowerCase();
    const tKey = therapistAddress.toLowerCase();
    if (!db.consents[pKey]) db.consents[pKey] = [];
    if (!db.consents[pKey].includes(tKey)) {
        db.consents[pKey].push(tKey);
    }
    saveSimulatedDB(db);
}

function removeSimulatedTherapist(patientAddress, therapistAddress) {
    const db = getSimulatedDB();
    const pKey = patientAddress.toLowerCase();
    const tKey = therapistAddress.toLowerCase();
    if (db.consents[pKey]) {
        db.consents[pKey] = db.consents[pKey].filter(a => a !== tKey);
    }
    saveSimulatedDB(db);
}

function getSimulatedAuthorizedTherapists(patientAddress) {
    if (!patientAddress) return [];
    const db = getSimulatedDB();
    return db.consents[patientAddress.toLowerCase()] || [];
}

function checkSimulatedAccess(patientAddress, therapistAddress) {
    if (!patientAddress || !therapistAddress) return false;
    if (patientAddress.toLowerCase() === therapistAddress.toLowerCase()) return true;
    const db = getSimulatedDB();
    const list = db.consents[patientAddress.toLowerCase()] || [];
    return list.includes(therapistAddress.toLowerCase());
}

function seedSimulatedDataIfEmpty() {
    const db = getSimulatedDB();
    const patientKey = state.demoAccounts.patient.toLowerCase();
    const therapistKey = state.demoAccounts.therapist.toLowerCase();

    if (!db.entries[patientKey] || db.entries[patientKey].length === 0) {
        const now = Math.floor(Date.now() / 1000);
        db.entries[patientKey] = [
            {
                id: 1,
                patient: state.demoAccounts.patient,
                timestamp: now - 86400 * 3,
                moodScore: 4,
                anxietyScore: 7,
                sleepHours: 5,
                activityTag: 'Work / Career Stress',
                encryptedNote: encryptJournalNote('Felt overwhelmed by deadlines today. Struggled to sleep.', 'mindchain-safe-key-123'),
                isCrisis: false
            },
            {
                id: 2,
                patient: state.demoAccounts.patient,
                timestamp: now - 86400 * 2,
                moodScore: 6,
                anxietyScore: 5,
                sleepHours: 7,
                activityTag: 'Meditation & Mindfulness',
                encryptedNote: encryptJournalNote('Completed 20 mins morning meditation. Felt more grounded.', 'mindchain-safe-key-123'),
                isCrisis: false
            },
            {
                id: 3,
                patient: state.demoAccounts.patient,
                timestamp: now - 86400 * 1,
                moodScore: 8,
                anxietyScore: 3,
                sleepHours: 8,
                activityTag: 'Physical Exercise',
                encryptedNote: encryptJournalNote('Went for a long walk in nature. Mood is significantly elevated!', 'mindchain-safe-key-123'),
                isCrisis: false
            }
        ];

        // Seed initial therapist authorization
        db.consents[patientKey] = [therapistKey];
        saveSimulatedDB(db);
    }
}

