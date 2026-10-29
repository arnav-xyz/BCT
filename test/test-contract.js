import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
    console.log('====================================================');
    console.log('   Running MindChain Smart Contract Test Suite     ');
    console.log('====================================================\n');

    const contractDataPath = path.resolve(__dirname, '..', 'public', 'contractData.json');
    const contractData = JSON.parse(fs.readFileSync(contractDataPath, 'utf8'));

    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const accounts = await provider.listAccounts();

    if (accounts.length < 3) {
        throw new Error('Test requires at least 3 accounts on JSON-RPC node.');
    }

    const patient = accounts[0];      // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    const therapist = accounts[1];    // 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    const unauthorized = accounts[2]; // 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

    console.log(`[Setup] Patient:      ${await patient.getAddress()}`);
    console.log(`[Setup] Therapist:    ${await therapist.getAddress()}`);
    console.log(`[Setup] Unauthorized: ${await unauthorized.getAddress()}\n`);

    // 1. Deploy fresh contract instance for tests
    const factory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, patient);
    const mindChain = await factory.deploy();
    await mindChain.waitForDeployment();
    const contractAddress = await mindChain.getAddress();
    console.log(`[Test Deploy] Fresh contract deployed at: ${contractAddress}\n`);

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  PASSED: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  FAILED: ${name}`);
            console.error(`    Error: ${err.message}`);
            failed++;
        }
    }

    // Connect contract with different signers
    const patientContract = mindChain.connect(patient);
    const therapistContract = mindChain.connect(therapist);
    const unauthContract = mindChain.connect(unauthorized);

    console.log('--- Test Suite: Mood Logging & Crisis Detection ---');

    await test('Patient can log a normal mood entry', async () => {
        const tx = await patientContract.logMoodEntry(
            8,                  // mood: 8/10
            2,                  // anxiety: 2/10
            8,                  // sleep: 8 hours
            "Meditation & Walk",
            "U2FsdGVkX1+MockEncryptedJournalContent123=="
        );
        const receipt = await tx.wait();
        if (!receipt.status) throw new Error('Transaction failed');

        const count = await patientContract.getMyEntryCount();
        if (Number(count) !== 1) throw new Error(`Expected count 1, got ${count}`);
    });

    await test('Patient can log a crisis distress entry with automatic crisis flag', async () => {
        const tx = await patientContract.logMoodEntry(
            2,                  // mood: 2 (Severe distress)
            9,                  // anxiety: 9 (Severe panic)
            3,                  // sleep: 3 hours
            "Panic attack",
            "U2FsdGVkX1+EmergencyReflectionAESEncrypted=="
        );
        await tx.wait();

        const entries = await patientContract.getMyEntries();
        if (entries.length !== 2) throw new Error(`Expected 2 entries, got ${entries.length}`);

        const crisisEntry = entries[1];
        if (crisisEntry.isCrisis !== true) {
            throw new Error(`Expected isCrisis to be true, got ${crisisEntry.isCrisis}`);
        }
    });

    await test('Contract rejects invalid mood score (> 10)', async () => {
        try {
            await patientContract.logMoodEntry(11, 5, 8, "Work", "note");
            throw new Error('Should have reverted for mood score 11');
        } catch (err) {
            if (!err.message.includes('Mood score must be between 1 and 10') && !err.message.includes('reverted')) {
                throw err;
            }
        }
    });

    await test('Contract rejects invalid sleep hours (> 24)', async () => {
        try {
            await patientContract.logMoodEntry(5, 5, 25, "Work", "note");
            throw new Error('Should have reverted for sleep hours 25');
        } catch (err) {
            if (!err.message.includes('Sleep hours cannot exceed 24') && !err.message.includes('reverted')) {
                throw err;
            }
        }
    });

    console.log('\n--- Test Suite: Therapist Authorization & Access Control ---');

    const patientAddress = await patient.getAddress();
    const therapistAddress = await therapist.getAddress();

    await test('Unauthorized address cannot view patient entries', async () => {
        try {
            await unauthContract.getPatientEntries(patientAddress);
            throw new Error('Should have reverted with unauthorized error');
        } catch (err) {
            if (!err.message.includes('Access denied') && !err.message.includes('reverted')) {
                throw err;
            }
        }
    });

    await test('Therapist is initially NOT authorized', async () => {
        const isAuth = await patientContract.checkTherapistAccess(patientAddress, therapistAddress);
        if (isAuth !== false) throw new Error('Therapist should not be authorized yet');
    });

    await test('Patient authorizes therapist address', async () => {
        const tx = await patientContract.authorizeTherapist(therapistAddress);
        await tx.wait();

        const isAuth = await patientContract.checkTherapistAccess(patientAddress, therapistAddress);
        if (isAuth !== true) throw new Error('Therapist should now be authorized');

        const authList = await patientContract.getMyAuthorizedTherapists();
        if (authList.length !== 1 || authList[0].toLowerCase() !== therapistAddress.toLowerCase()) {
            throw new Error('Therapist list does not contain newly authorized therapist');
        }
    });

    await test('Authorized therapist CAN now retrieve patient entries', async () => {
        const entries = await therapistContract.getPatientEntries(patientAddress);
        if (entries.length !== 2) throw new Error(`Expected 2 entries, received ${entries.length}`);
        if (Number(entries[0].moodScore) !== 8) throw new Error('Mismatch in moodScore for entry 0');
        if (entries[1].isCrisis !== true) throw new Error('Expected entry 1 to have isCrisis=true');
    });

    await test('Patient can revoke therapist access', async () => {
        const tx = await patientContract.revokeTherapist(therapistAddress);
        await tx.wait();

        const isAuth = await patientContract.checkTherapistAccess(patientAddress, therapistAddress);
        if (isAuth !== false) throw new Error('Therapist should no longer be authorized');
    });

    await test('Revoked therapist can no longer view patient records', async () => {
        try {
            await therapistContract.getPatientEntries(patientAddress);
            throw new Error('Should have reverted after access was revoked');
        } catch (err) {
            if (!err.message.includes('Access denied') && !err.message.includes('reverted')) {
                throw err;
            }
        }
    });

    console.log('\n====================================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
});

