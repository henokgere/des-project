import React, { useState } from 'react';

const App = () => {
  const [mode, setMode] = useState('encrypt');
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');
  const [blocks, setBlocks] = useState([]); // Store 64-bit blocks

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
      </div>
    </>
  );
};

export default App;
