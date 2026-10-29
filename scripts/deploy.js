import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('--- MindChain Deployment Script ---');

    const contractDataPath = path.resolve(__dirname, '..', 'public', 'contractData.json');
    if (!fs.existsSync(contractDataPath)) {
        console.error('contractData.json not found! Run "npm run compile" first.');
        process.exit(1);
    }

    const contractData = JSON.parse(fs.readFileSync(contractDataPath, 'utf8'));

    // Default to localhost:8545 or environment RPC
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    console.log(`Connecting to RPC: ${rpcUrl}...`);

    let provider;
    try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`Connected to Network: Chain ID ${network.chainId.toString()}`);
    } catch (err) {
        console.error(`Failed to connect to RPC node at ${rpcUrl}.`);
        console.error(`Ensure local blockchain is running: run "npm run node" in a separate terminal.`);
        process.exit(1);
    }

    // Get signer (either from private key or first node account)
    let deployer;
    if (process.env.PRIVATE_KEY) {
        deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    } else {
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) {
            console.error('No accounts found on RPC provider. Provide PRIVATE_KEY in env.');
            process.exit(1);
        }
        deployer = accounts[0];
    }

    const deployerAddress = await deployer.getAddress();
    console.log(`Deployer Account: ${deployerAddress}`);

    const factory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, deployer);
    console.log('Deploying MindChain contract...');

    const mindChain = await factory.deploy();
    await mindChain.waitForDeployment();

    const deployedAddress = await mindChain.getAddress();
    console.log(`MindChain deployed successfully to: ${deployedAddress}`);

    // Update public/contractData.json with deployed address
    contractData.address = deployedAddress;
    contractData.network = 'localhost';
    fs.writeFileSync(contractDataPath, JSON.stringify(contractData, null, 2));
    console.log(`Updated public/contractData.json with deployed address.`);

    // Also update build/MindChain.json
    const buildPath = path.resolve(__dirname, '..', 'build', 'MindChain.json');
    if (fs.existsSync(buildPath)) {
        const buildData = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
        buildData.address = deployedAddress;
        fs.writeFileSync(buildPath, JSON.stringify(buildData, null, 2));
    }

    console.log('\n--- Setup Ready! ---');
    console.log(`Contract Address: ${deployedAddress}`);
    console.log(`To start the web app, run: npm start`);
}

main().catch((err) => {
    console.error('Deployment error:', err);
    process.exit(1);
});

