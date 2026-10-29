# 🧠 MindChain — Privacy-First Decentralized Mental Health & Mood Ledger

**MindChain** is a lightweight, privacy-preserving blockchain application designed for mental health wellness tracking and confidential therapist-patient collaboration.

Built with **Solidity (EVM)**, **Ethers.js**, and **Client-Side AES-256 Encryption**, MindChain gives patients complete sovereignty over their sensitive psychological records while preventing centralized data breaches, profiling, and retroactive record tampering.

---

## 🌟 Why Blockchain for Mental Health?

Traditional Electronic Health Record (EHR) systems store deeply sensitive psychiatric notes on centralized cloud databases. These systems are prone to:
1. **Data Breaches & Subpoenas:** Centralized servers can be compromised, exposing deeply personal reflections.
2. **Commercial Exploitation:** Health data brokers sell patient analytics without transparent consent.
3. **Retroactive Tampering:** Logs can be altered or disputed in legal/clinical disagreements.

### 🛡️ How MindChain Solves This
* **Pseudonymous Identity:** Patients are identified solely by their Ethereum wallet address (`0x...`). No emails, phone numbers, or real identities are linked to the chain.
* **Tamper-Proof Timestamps:** Daily mood scores, sleep durations, anxiety levels, and context tags are immutably sealed on-chain with block timestamps.
* **Zero-Knowledge Client-Side AES Encryption:** Personal reflection notes are encrypted locally in the patient's browser using AES-256 before being broadcast. The blockchain stores only the ciphertext—even network validators cannot read private thoughts without the user's secret key.
* **Smart Contract Access Control:** Patients grant or revoke read access to licensed therapist addresses via on-chain smart contract functions (`authorizeTherapist` / `revokeTherapist`). Queries from unauthorized addresses are reverted at the EVM level.
* **Automated Crisis Alert Detection:** If a check-in logs critical distress (e.g. Mood $\le 2$ and Anxiety $\ge 8$), an on-chain `CrisisAlert` event is emitted to alert designated emergency contacts and trigger immediate crisis support resources.

---

## 🏛️ Smart Contract Architecture (`MindChain.sol`)

```solidity
struct MoodEntry {
    uint256 id;
    uint256 timestamp;
    uint8 moodScore;       // 1 (Severe Distress) to 10 (Optimal / Joyful)
    uint8 anxietyScore;    // 1 (Completely Calm) to 10 (Severe Panic)
    uint8 sleepHours;      // 0 to 24 hours
    string activityTag;    // e.g., "Meditation", "Work", "Therapy"
    string encryptedNote;  // Client-side AES-encrypted journal
    bool isCrisis;         // Flagged true if mood <= 2 && anxiety >= 8
}
```

### Core Contract Functions
| Function | Description | Access |
| :--- | :--- | :--- |
| `logMoodEntry(...)` | Commits daily check-in with tamper-proof block timestamp | Anyone (Caller) |
| `getMyEntries()` | Retrieves all historical entries for the caller | Patient |
| `authorizeTherapist(address)` | Grants an Ethereum address read access to caller's records | Patient |
| `revokeTherapist(address)` | Revokes read access from a therapist address | Patient |
| `getPatientEntries(address)` | Retrieves patient entries. Reverts if caller is unauthorized | Patient or Authorized Therapist |
| `checkTherapistAccess(patient, therapist)` | Checks authorization status between two addresses | Public View |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** (v18+)
- **NPM** (v9+)

### 1. Compile the Smart Contract
Compiles `contracts/MindChain.sol` using Solidity 0.8.20 and exports ABI & Bytecode to `public/contractData.json`:
```bash
npm run compile
```

### 2. Run the Automated Test Suite
Executes end-to-end tests covering entry logging, crisis detection, authorization, and unauthorized access rejection:
```bash
npm test
```
*Output: 10 Passed, 0 Failed.*

### 3. Start Local EVM Blockchain (Optional for Live Web3)
Starts a local Hardhat node with 20 pre-funded test accounts:
```bash
npm run node
```

### 4. Deploy Contract to Local Blockchain
Deploys `MindChain` and updates `public/contractData.json` with the deployed address:
```bash
npm run deploy
```

### 5. Launch the Web Application
Starts the zero-dependency web server:
```bash
npm start
```
Open **[http://localhost:3333](http://localhost:3333)** in your web browser.

---

## 🖥️ Application Features & Walkthrough

1. **Daily Check-in Portal (Patient):**
   - Interactive sliders for Mood (1-10) with dynamic emotion emoji display.
   - Anxiety level slider (1-10) and Sleep duration selector.
   - Activity Context (Meditation, Work Stress, Exercise, Therapy Session).
   - AES-256 client-side encrypted confidential reflection journal.
2. **Wellness Timeline & Analytics:**
   - Real-time Chart.js graph tracking Mood and Anxiety over time.
   - Metric cards showing average mood, average anxiety, and total on-chain logs.
   - One-click decryption of personal reflections using your secret key.
3. **Therapist Sharing & Consent:**
   - Add therapist wallet address (`0x...`) to grant access.
   - Table of authorized clinicians with instant revocation.
4. **Clinical Portal (Therapist):**
   - Clinicians query patient records by wallet address.
   - Smart contract enforces authorization: unauthorized queries are strictly blocked.
   - Displays patient mood trends and flags crisis check-ins.
5. **Calm Zone & 24/7 Crisis Helplines:**
   - Guided **4-7-8 Parasympathetic Breathing Tool** with animated visual pacing to alleviate acute anxiety.
   - Direct access to 24/7 crisis hotlines (988 Suicide & Crisis Lifeline, Crisis Text Line 741741).

---

## 🔒 Security & Privacy Model

```
[ Patient Browser ]
      |
      |-- 1. Encrypt reflection note using AES-256 (Passphrase never leaves browser)
      |-- 2. Sign transaction with Ethereum private key (MetaMask / Local Signer)
      v
[ EVM Smart Contract (MindChain.sol) ]
      |
      |-- 3. Verifies input boundaries (Mood: 1-10, Anxiety: 1-10, Sleep <= 24)
      |-- 4. Automatically evaluates crisis distress criteria (Mood <= 2 & Anxiety >= 8)
      |-- 5. Immutably records timestamped struct to blockchain
      v
[ Therapist Clinical Query ]
      |
      |-- 6. Checks: require(msg.sender == patient || isTherapistAuthorized[patient][msg.sender])
      |-- If authorized: Returns encrypted logs for clinician review
      |-- If unauthorized: Reverts transaction ("Access Denied")
```

---

## 📁 Repository Structure

```
BCT/
├── contracts/
│   └── MindChain.sol           # Solidity Smart Contract (0.8.20)
├── scripts/
│   ├── compile.js              # Standalone Solidity compiler
│   └── deploy.js               # Ethers.js contract deployment script
├── test/
│   └── test-contract.js        # Automated unit test suite (10/10 tests)
├── public/
│   ├── index.html              # Responsive web dashboard
│   ├── styles.css              # Calming, modern styling
│   ├── app.js                  # Frontend Web3, AES encryption & Chart logic
│   └── contractData.json       # Generated ABI, bytecode & deployed address
├── hardhat.config.js           # Hardhat configuration
├── server.js                   # Lightweight static server (Port 3333)
├── package.json                # Project scripts and dependencies
└── README.md                   # Full documentation
```

