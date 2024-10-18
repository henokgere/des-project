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

const App = () => {
  const [mode, setMode] = useState('encrypt');
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
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

  // Function to break text into 64-bit blocks
  const splitInto64BitBlocks = (text) => {
    const binaryText = toBinary(text);
    const blockSize = 64; // 64 bits
    const blocks = [];

    // Split the binary text into 64-bit blocks
    for (let i = 0; i < binaryText.length; i += blockSize) {
      let block = binaryText.slice(i, i + blockSize);

      // If the block is smaller than 64 bits, pad it with zeroes
      if (block.length < blockSize) {
        block = block.padEnd(blockSize, '0');
      }

      blocks.push(block);
    }

    return blocks;
  };

  // Function to handle text input and perform E-table expansion
  const handleExpansion = (binaryBlocks) => {
    // Apply E-table expansion to each 32-bit block
    const expanded = binaryBlocks.map(block => applyETable(block));
    setExpandedBlocks(expanded);
  };

  // Function to encrypt or decrypt based on the mode
  const handleOperation = () => {
    if (!text || !key) {
      alert('Please enter both text and key.');
      return;
    }

    const operationKey = parseInt(key);
    const modifiedText = text
      .split('')
      .map((char) => {
        let charCode = char.charCodeAt(0);
        if (mode === 'encrypt') {
          // For encryption, add the key to char code
          return String.fromCharCode(charCode + operationKey);
        } else {
          // For decryption, subtract the key from char code
          return String.fromCharCode(charCode - operationKey);
        }
      })
      .join('');

    setResult(modifiedText);

    // Break into 64-bit blocks
    const binaryBlocks = splitInto64BitBlocks(text);
    setBlocks(binaryBlocks);

    // Apply initial permutation to each block
    const permuted = binaryBlocks.map(block => applyPermutation(block, initialPermutation));
    setPermutedBlocks(permuted);

    //expand via e table
    handleExpansion(binaryBlocks)

    // Apply final permutation to each block
    const finalPermuted = binaryBlocks.map(block => applyPermutation(block, finalPermutation));
    setFinalPermutedBlocks(finalPermuted);
  };

  return (
    <>
      <div style={{ padding: '20px' }}>
        <h2>Simple Encryption/Decryption (DES-Like)</h2>
        <div>
          <label>
            <input
              type="radio"
              value="encrypt"
              checked={mode === 'encrypt'}
              onChange={() => setMode('encrypt')}
            />
            Encrypt
          </label>
          <label style={{ marginLeft: '10px' }}>
            <input
              type="radio"
              value="decrypt"
              checked={mode === 'decrypt'}
              onChange={() => setMode('decrypt')}
            />
            Decrypt
          </label>
        </div>
        <div>
          <input
            type="text"
            placeholder="Enter text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ marginTop: '10px', width: '100%' }}
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Enter key (use + or -)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={{ marginTop: '10px', width: '100%' }}
          />
        </div>
        <button onClick={handleOperation} style={{ marginTop: '10px' }}>
          {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
        </button>
        {result && (
          <div style={{ marginTop: '20px' }}>
            <h3>Result:</h3>
            <p>{result}</p>
          </div>
        )}
        {blocks.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>64-bit Blocks:</h3>
            {blocks.map((block, index) => (
              <p key={index}>Block {index + 1}: {block}</p>
            ))}
          </div>
        )}
        {permutedBlocks.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Permuted Blocks:</h3>
            {permutedBlocks.map((block, index) => (
              <p key={index}>Permuted Block {index + 1}: {block}</p>
            ))}
          </div>
        )}
        {expandedBlocks.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>48-bit Expanded Blocks (E-table):</h3>
            {expandedBlocks.map((block, index) => (
              <p key={index}>Expanded Block {index + 1}: {block}</p>
            ))}
          </div>
        )}
        {finalPermutedBlocks.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Final Permuted Blocks:</h3>
            {finalPermutedBlocks.map((block, index) => (
              <p key={index}>Permuted Block {index + 1}: {block}</p>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default App;
