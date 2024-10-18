import React, { useState } from 'react';

// Initial and final permutation tables
const initialPermutation = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7
];

const finalPermutation = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25
];

// Function to apply a given permutation to a 64-bit binary block
const applyPermutation = (block, permutationTable) => {
  return permutationTable.map(index => block[index - 1]).join('');
};

// E-table (Expansion table) for 32-bit to 48-bit expansion
const eTable = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11,
  12, 13, 12, 13, 14, 15, 16, 17, 16, 17, 18, 19, 20, 21, 20, 21,
  22, 23, 24, 25, 24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1
]; 

// Function to apply E-table to a 32-bit block to expand it to 48 bits
const applyETable = (block32) => {
  return applyPermutation(block32, eTable);
};

// Permutation Choice 1 (PC-1)
const pc1 = [
  57, 49, 41, 33, 25, 17, 9,
  1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27,
  19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15,
  7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29,
  21, 13, 5, 28, 20, 12, 4
];

// Permutation Choice 2 (PC-2)
const pc2 = [
  14, 17, 11, 24, 1, 5,
  3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8,
  16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55,
  30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53,
  46, 42, 50, 36, 29, 32
];

// Shifts per round
const shiftsPerRound = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

const App = () => {
  const [mode, setMode] = useState('encrypt');
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [pc1Key, setPc1Key] = useState('');
  const [subkeys, setSubkeys] = useState([]);
  const [xoredBlock, setXoredBlock] = useState(''); // Store XOR result
  const [result, setResult] = useState('');
  const [blocks, setBlocks] = useState([]); // Store 64-bit blocks
  const [permutedBlocks, setPermutedBlocks] = useState([]); // Store permuted blocks
  const [expandedBlocks, setExpandedBlocks] = useState([]); // Store 48-bit blocks after E-table expansion
  const [finalPermutedBlocks, setFinalPermutedBlocks] = useState([]); // Store final permuted blocks

  // Helper function to convert string to binary
  const toBinary = (text) => {
    return text.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
  };

  // Function to omit every 8th bit from 64-bit binary key and reduce to 56-bit key
  const omit8thBits = (binaryKey) => {
    let result = '';
    for (let i = 0; i < binaryKey.length; i++) {
      if ((i + 1) % 8 !== 0) { // Skip every 8th bit
        result += binaryKey[i];
      }
    }
    return result;
  };

  // Function to apply circular left shifts
  const leftShift = (keyHalf, shifts) => {
    return keyHalf.slice(shifts) + keyHalf.slice(0, shifts);
  };

  // Function to split a binary string into two equal halves
  const splitIntoHalves = (binaryString) => {
    const halfLength = binaryString.length / 2;
    return [binaryString.slice(0, halfLength), binaryString.slice(halfLength)];
  };

  // Function to generate the 16 subkeys using PC-1, PC-2 and left shifts
  const generateSubkeys = (binaryKey56) => {
    const [left, right] = splitIntoHalves(binaryKey56);
    let subkeys = [];

    let currentLeft = left;
    let currentRight = right;

    for (let round = 0; round < 16; round++) {
      // Perform left shifts for this round
      currentLeft = leftShift(currentLeft, shiftsPerRound[round]);
      currentRight = leftShift(currentRight, shiftsPerRound[round]);

      // Combine left and right halves
      const combinedKey = currentLeft + currentRight;

      // Apply PC-2 to get the subkey for this round
      const subkey = applyPermutation(combinedKey, pc2);
      subkeys.push(subkey);
    }

    return subkeys;
  };

  // XOR function
  const xor = (block48, key48) => {
    let xoredResult = '';
    for (let i = 0; i < block48.length; i++) {
      xoredResult += (block48[i] === key48[i] ? '0' : '1');
    }
    return xoredResult;
  };

  // Handle key processing and subkey generation
  const handleKeyProcessing = () => {
    // Convert key to binary and omit every 8th bit
    const binaryKey = toBinary(key).padEnd(64, '0').slice(0, 64);
    const binaryKey56 = omit8thBits(binaryKey);
    console.log("56-bit Key:", binaryKey56);

    // Apply PC-1
    const permutedKey56 = applyPermutation(binaryKey56, pc1);
    setPc1Key(permutedKey56);
    console.log("After PC-1:", permutedKey56);

    // Generate subkeys for 16 rounds using shifts and PC-2
    const subkeys = generateSubkeys(permutedKey56);
    setSubkeys(subkeys);
    console.log("Generated Subkeys:", subkeys);

    // Test: Perform XOR of 48-bit expanded block with the first subkey
    const testBlock32 = '01101101011010100101010101010101'; // Example 32-bit block (adjust as needed)
    const expandedBlock48 = applyETable(testBlock32);
    setExpandedBlocks([expandedBlock48]); // Store expanded block
    console.log("Expanded Block:", expandedBlock48);

    const xored = xor(expandedBlock48, subkeys[0]);
    setXoredBlock(xored); // Store XOR result
    console.log("XOR with Subkey:", xored);
  };

  return (
    <div>
      <h1>Simple DES-Like Encryption/Decryption</h1>

      <div>
        <label>Mode: </label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="encrypt">Encrypt</option>
          <option value="decrypt">Decrypt</option>
        </select>
      </div>

      <div>
        <label>Text: </label>
        <input value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div>
        <label>Key: </label>
        <input value={key} onChange={(e) => setKey(e.target.value)} />
        <button onClick={handleKeyProcessing}>Process Key</button>
      </div>

      <h2>Results</h2>
      <div>
        <h3>PC-1 Key: {pc1Key}</h3>
        <h3>Generated Subkeys:</h3>
        <ul>
          {subkeys.map((subkey, index) => (
            <li key={index}>Round {index + 1}: {subkey}</li>
          ))}
        </ul>
        <h3>Expanded Block (48-bit): {expandedBlocks[0]}</h3>
        <h3>XOR Result with First Subkey: {xoredBlock}</h3>
      </div>

    </div>
  );
};

export default App;
