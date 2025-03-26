var words = require('an-array-of-english-words');

// We replicate the same ALPHABET_32 as your Python version
const ALPHABET_32 = (
  "AABCDEEFGHIIJKLMNOOPQRSTUU " + // 26 chars total
  "VWXYZ "                       // 6 digits
);

const charToVal: { [char: string]: number } = {};
const valToChar: { [value: number]: string } = {};

ALPHABET_32.split("").forEach((ch, i) => {
  charToVal[ch] = i;
  valToChar[i] = ch;
});

/**
 * We convert the entire array of words to lowercase and store them in a Set
 * for quick membership checks.
 */
const englishWordSet = new Set(words.map((word: string) => word.toLowerCase()));

/**
 * Check if `word` is a valid English word by looking it up in
 * the `englishWordSet`.
 */
function isEnglishWord(word: string): boolean {
  return englishWordSet.has(word.toLowerCase());
}

/**
 * Convert a list of bits (MSB first) into an integer.
 */
function bitsToInt(bits: number[]): number {
  let val = 0;
  for (const b of bits) {
    val = (val << 1) | b;
  }
  return val;
}

/**
 * Read a single bit from the 21x21 matrix in row-major order.
 */
function getBit(matrix: number[][], bitIndex: number): number {
  const row = Math.floor(bitIndex / 21);
  const col = bitIndex % 21;
  return row < matrix.length && col < matrix[0].length ? matrix[row][col] : 0;
}

/**
 * Read `length` bits from `matrix` in row-major order, starting at `startIndex`.
 */
function getBitsFromMatrix(matrix: number[][], startIndex: number, length: number): number[] {
  const bits: number[] = [];
  for (let i = 0; i < length; i++) {
    bits.push(getBit(matrix, startIndex + i));
  }
  return bits;
}

/**
 * Decodes the entire 21x21 matrix into a string without reading a length prefix.
 * Uses all bits in the matrix, grouped into 5-bit chunks to map to characters.
 */
function decodeMatrix(matrix: number[][]): string {
  const MATRIX_SIZE = 21;
  const BITS_PER_CHAR = 5;
  
  // Calculate total bits in the matrix and how many complete characters we can decode
  const totalBits = MATRIX_SIZE * MATRIX_SIZE;
  const numCompleteChars = Math.floor(totalBits / BITS_PER_CHAR);
  
  const messageChars: string[] = [];
  
  // Process all complete characters (5 bits each)
  for (let i = 0; i < numCompleteChars; i++) {
    const startIndex = i * BITS_PER_CHAR;
    const chunk = getBitsFromMatrix(matrix, startIndex, BITS_PER_CHAR);
    const val = bitsToInt(chunk);
    const ch = valToChar[val];
    messageChars.push(ch);
  }
  
  return messageChars.join("");
}

/**
 * Type for the matrix request:
 * Expects a JSON body containing:
 *    {
 *      matrix: [[0,1,...,0], [...], ...] // 21 rows, 21 columns each
 *    }
 */
export interface MatrixRequest {
  matrix: number[][]; // 21x21 of 0/1
}

/**
 * Decodes the entire matrix into a string, splits it randomly (chunk size 2..7),
 * and then builds an object of { word -> "true"/"false" }, indicating whether
 * each chunk (with length > 3) is recognized as an English word.
 */
export function decodeWordMatrix(matrix: number[][]): Record<string, "true" | "false"> {
  // Decode the entire matrix
  const decodedMsg = decodeMatrix(matrix);
  
  // Remove spaces
  const noSpaceMsg = decodedMsg.replace(/\s+/g, "");

  // If the message is empty or just spaces, provide a default placeholder
  if (noSpaceMsg.length === 0) {
    return { "PLACE": "true", "PIXELS": "true" };
  }

  // Split into random segments of length 2..7
  const segments: string[] = [];
  let i = 0;
  while (i < noSpaceMsg.length) {
    const chunkSize = Math.min(
      Math.floor(Math.random() * (7 - 2 + 1)) + 2,
      noSpaceMsg.length - i
    );
    const segment = noSpaceMsg.slice(i, i + chunkSize);
    segments.push(segment);
    i += chunkSize;
  }

  // Build the object with "true"/"false" for each segment that is length>3
  const resultDict: Record<string, "true" | "false"> = {};
  for (const seg of segments) {
    if (seg.length > 3) {
      resultDict[seg] = isEnglishWord(seg) ? "true" : "false";
    }
  }
  
  return resultDict;
}
