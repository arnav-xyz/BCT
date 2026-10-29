import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function compileContract() {
    console.log('--- Compiling contracts/MindChain.sol ---');

    const contractPath = path.resolve(__dirname, '..', 'contracts', 'MindChain.sol');
    const sourceCode = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'MindChain.sol': {
                content: sourceCode
            }
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode']
                }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    let hasErrors = false;
    if (output.errors) {
        for (const error of output.errors) {
            if (error.severity === 'error') {
                console.error('Compiler Error:', error.formattedMessage);
                hasErrors = true;
            } else {
                console.warn('Compiler Warning:', error.formattedMessage);
            }
        }
    }

    if (hasErrors) {
        process.exit(1);
    }

    const contract = output.contracts['MindChain.sol']['MindChain'];
    const contractData = {
        contractName: 'MindChain',
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        compiledAt: new Date().toISOString()
    };

    const buildDir = path.resolve(__dirname, '..', 'build');
    const publicDir = path.resolve(__dirname, '..', 'public');
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    fs.writeFileSync(path.join(buildDir, 'MindChain.json'), JSON.stringify(contractData, null, 2));
    fs.writeFileSync(path.join(publicDir, 'contractData.json'), JSON.stringify(contractData, null, 2));

    console.log('Compilation successful!');
    console.log('Saved ABI & Bytecode:');
    console.log('  -> build/MindChain.json');
    console.log('  -> public/contractData.json');
    return contractData;
}

// Run directly if called as main module
if (process.argv[1] === __filename) {
    compileContract();
}
