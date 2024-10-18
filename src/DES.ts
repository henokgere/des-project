export class DES {
    private subkeys: bigint[]; // Array to store the 16 round subkeys
  
    constructor(key: Uint8Array) {
      // Generate subkeys from the input key
      this.subkeys = this.generateSubkeys(this.bytesToBigInt(key));
    }
  
    // Public method to encrypt a plaintext
    encrypt(plaintext: Uint8Array): Uint8Array {
      return this.crypt(plaintext, false);
    }
  
    // Public method to decrypt a ciphertext
    decrypt(ciphertext: Uint8Array): Uint8Array {
      return this.crypt(ciphertext, true);
    }
  
    // Core encryption/decryption function
    private crypt(input: Uint8Array, decrypt: boolean): Uint8Array {
      const blocks = Math.ceil(input.length / 8); // Calculate number of 8-byte blocks
      const output = new Uint8Array(blocks * 8); // Prepare output array
  
      for (let i = 0; i < blocks; i++) {
        // Process each 8-byte block
        const block = input.slice(i * 8, (i + 1) * 8);
        const paddedBlock = new Uint8Array(8);
        paddedBlock.set(block); // Ensure block is 8 bytes (pad if necessary)
  
        let data = this.bytesToBigInt(paddedBlock); // Convert block to bigint
        data = this.initialPermutation(data); // Apply initial permutation
  
        let left = data >> 32n; // Split into left and right halves
        let right = data & 0xffffffffn;
  
        // 16 rounds of Feistel network
        for (let round = 0; round < 16; round++) {
          const subkey = decrypt ? this.subkeys[15 - round] : this.subkeys[round];
          const temp = left;
          left = right;
          right = temp ^ this.feistel(right, subkey); // XOR with Feistel function output
        }
  
        data = (right << 32n) | left; // Combine left and right halves
        data = this.finalPermutation(data); // Apply final permutation
  
        const result = this.bigIntToBytes(data); // Convert result back to bytes
        output.set(result, i * 8); // Set result in output array
      }
  
      return output;
    }
  
    // Feistel function (F function in DES)
    private feistel(right: bigint, subkey: bigint): bigint {
      const expanded = this.expand(right); // Expand 32-bit input to 48 bits
      const xored = expanded ^ subkey; // XOR with round subkey
      let result = 0n;
  
      // S-box substitution
      for (let i = 0; i < 8; i++) {
        const block = Number((xored >> BigInt(42 - i * 6)) & 0x3fn); // Extract 6-bit block
        const row = ((block & 0x20) >> 4) | (block & 0x01); // Calculate row (first and last bit)
        const col = (block >> 1) & 0x0f; // Calculate column (middle 4 bits)
        result = (result << 4n) | BigInt(S_BOXES[i][row][col]); // Lookup in S-box and combine result
      }
  
      return this.permute(result, P, 32); // Apply P-box permutation
    }
  
    // Generate 16 round subkeys from the initial key
    private generateSubkeys(key: bigint): bigint[] {
      const subkeys: bigint[] = [];
      let permutedKey = this.permute(key, PC1, 56); // Apply PC1 permutation
  
      let left = permutedKey >> 28n; // Split into left and right halves
      let right = permutedKey & 0xfffffffn;
  
      for (let i = 0; i < 16; i++) {
        // Rotate left and right halves
        left =
          ((left << BigInt(SHIFTS[i])) | (left >> (28n - BigInt(SHIFTS[i])))) &
          0xfffffffn;
        right =
          ((right << BigInt(SHIFTS[i])) | (right >> (28n - BigInt(SHIFTS[i])))) &
          0xfffffffn;
  
        const combined = (left << 28n) | right; // Combine halves
        subkeys.push(this.permute(combined, PC2, 48)); // Apply PC2 permutation and add to subkeys
      }
  
      return subkeys;
    }
  
    private permute(input: bigint, table: number[], outputBits: number): bigint {
      let output = 0n;
      for (let i = 0; i < table.length; i++) {
        if (input & (1n << BigInt(64 - table[i]))) {
          output |= 1n << BigInt(outputBits - 1 - i);
        }
      }
      return output;
    }
  
    private expand(input: bigint): bigint {
      return this.permute(input, E, 48);
    }
  
    // Initial Permutation (IP in DES)
    private initialPermutation(input: bigint): bigint {
      return this.permute(input, IP, 64);
    }
  
    // Final Permutation (FP in DES)
    private finalPermutation(input: bigint): bigint {
      return this.permute(input, FP, 64);
    }
  
    // Convert byte array to bigint
    private bytesToBigInt(bytes: Uint8Array): bigint {
      let result = 0n;
      for (const byte of bytes) {
        result = (result << 8n) | BigInt(byte);
      }
      return result;
    }
  
    // Convert bigint to byte array
    private bigIntToBytes(n: bigint): Uint8Array {
      const bytes = new Uint8Array(8);
      for (let i = 7; i >= 0; i--) {
        bytes[i] = Number(n & 0xffn);
        n >>= 8n;
      }
      return bytes;
    }
  
    // Static method to pad input to multiple of 8 bytes
    static padInput(input: Uint8Array): Uint8Array {
      const blockSize = 8;
      const padding = blockSize - (input.length % blockSize);
      const paddedInput = new Uint8Array(input.length + padding);
      paddedInput.set(input);
      paddedInput.fill(padding, input.length);
      return paddedInput;
    }
  
    // Static method to remove padding from decrypted data
    static unpadInput(input: Uint8Array): Uint8Array {
      const padding = input[input.length - 1];
      return input.slice(0, input.length - padding);
    }
  }
  
  const IP = [
    58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4, 62, 54, 46, 38,
    30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8, 57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3, 61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39,
    31, 23, 15, 7,
  ];
  const FP = [
    40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31, 38, 6, 46, 14,
    54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29, 36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27, 34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9,
    49, 17, 57, 25,
  ];
  const E = [
    32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16,
    17, 16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25, 24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32, 1,
  ];
  const P = [
    16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14, 32,
    27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25,
  ];
  const PC1 = [
    57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35,
    27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38,
    30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
  ];
  const PC2 = [
    14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27,
    20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34,
    53, 46, 42, 50, 36, 29, 32,
  ];
  const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
  
  const S_BOXES = [
    [
      [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
      [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
      [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
      [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
    ],
  
    [
      [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
      [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
      [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
      [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
    ],
  
    [
      [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
      [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
      [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
      [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
    ],
  
    [
      [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
      [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
      [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
      [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
    ],
  
    [
      [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
      [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
      [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
      [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
    ],
  
    [
      [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
      [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
      [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
      [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
    ],
  
    [
      [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
      [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
      [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
      [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
    ],
  
    [
      [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
      [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
      [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
      [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
    ],
  ];
  