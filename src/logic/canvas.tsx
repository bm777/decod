import { Devvit } from '@devvit/public-api';

const GRID_SIZE = 21;
const CANVAS_KEY_PREFIX = 'decod:canvas:';
const CHALLENGE_COUNTER_KEY = 'decod:challenge:counter';

// Generate an empty canvas
export function createEmptyCanvas(): number[][] {
  return Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
}

// Get canvas from Redis
export async function getCanvas(redis: any, challengeId: string): Promise<number[][] | null> {
  if (!challengeId) {
    throw new Error("Challenge ID is required when retrieving a canvas");
  }
  const key = `${CANVAS_KEY_PREFIX}${challengeId}`;
  const canvasData = await redis.get(key);
  
  if (!canvasData) return null;
  
  try {
    return JSON.parse(canvasData as string);
  } catch (e) {
    return null;
  }
}

// Save canvas to Redis
export async function saveCanvas(redis: any, canvas: number[][], challengeId: string): Promise<void> {
  if (!challengeId) {
    throw new Error("Challenge ID is required when saving a canvas");
  }
  const key = `${CANVAS_KEY_PREFIX}${challengeId}`;
  await redis.set(key, JSON.stringify(canvas));
}

// Place a pixel on the canvas
export async function placePixel(
  redis: any,
  x: number,
  y: number, 
  color: number,
  challengeId: string,
  username?: string  // Optional username parameter
): Promise<void> {
  if (!challengeId) {
    throw new Error("Challenge ID is required when placing a pixel");
  }

  // Get current canvas
  const canvas = await getCanvas(redis, challengeId) || createEmptyCanvas();
  
  // Update pixel
  canvas[y][x] = color;
  
  // Save updated canvas
  await saveCanvas(redis, canvas, challengeId);
  
  // Track the user if a username is provided
  if (username) {
    await trackUserPixel(redis, username, challengeId);
  }
}

// Create a new challenge
export async function createNewChallenge(redis: any): Promise<string> {
  // Get current challenge counter
  const counterStr = await redis.get(CHALLENGE_COUNTER_KEY);
  const counter = counterStr ? parseInt(counterStr as string, 10) : 0;
  
  // Increment counter
  const newCounter = counter + 1;
  await redis.set(CHALLENGE_COUNTER_KEY, newCounter.toString());
  
  // Create empty canvas for this challenge
  const newChallengeId = newCounter.toString();
  await saveCanvas(redis, createEmptyCanvas(), newChallengeId);
  
  return newChallengeId;
}

// Get the current challenge ID
export async function getCurrentChallengeId(redis: any): Promise<string | null> {
  const counterStr = await redis.get(CHALLENGE_COUNTER_KEY);
  return counterStr ? (counterStr as string) : null;
}

// Get all available challenges
export async function getAllChallenges(redis: any): Promise<string[]> {
  const counterStr = await redis.get(CHALLENGE_COUNTER_KEY);
  const counter = counterStr ? parseInt(counterStr as string, 10) : 0;
  
  // Create an array of challenge IDs from 1 to the current counter
  const challenges: string[] = [];
  for (let i = 1; i <= counter; i++) {
    challenges.push(i.toString());
  }
  
  return challenges;
}

// New function to save words to Redis
export async function saveWords(
  redis: any,
  words: Record<string, string>,
  challengeId: string
): Promise<void> {
  if (!challengeId) {
    throw new Error("Challenge ID is required when saving words");
  }
  const key = `${CANVAS_KEY_PREFIX}${challengeId}:words`;
  await redis.set(key, JSON.stringify(words));
}

// New function to get words from Redis
export async function getWords(
  redis: any,
  challengeId: string
): Promise<Record<string, string> | null> {
  if (!challengeId) {
    throw new Error("Challenge ID is required when retrieving words");
  }
  const key = `${CANVAS_KEY_PREFIX}${challengeId}:words`;
  const wordsData = await redis.get(key);
  
  if (!wordsData) return null;
  
  try {
    return JSON.parse(wordsData as string);
  } catch (e) {
    return null;
  }
}

// Track users who place pixels in a challenge
export async function trackUserPixel(
  redis: any,
  username: string,
  challengeId: string
): Promise<void> {
  if (!challengeId || !username) {
    throw new Error("Challenge ID and username are required for tracking");
  }
  
  const key = `${CANVAS_KEY_PREFIX}${challengeId}:users:${username}`;
  const now = Date.now();
  await redis.set(key, now.toString());
  
  // Also update the last active user for this challenge
  const lastActiveKey = `${CANVAS_KEY_PREFIX}${challengeId}:lastActive`;
  await redis.set(lastActiveKey, JSON.stringify({ username, timestamp: now }));
}

// Get the user who last placed a pixel (potential winner)
export async function getLastActiveUser(
  redis: any,
  challengeId: string
): Promise<{ username: string, timestamp: number } | null> {
  if (!challengeId) {
    throw new Error("Challenge ID is required");
  }
  
  const key = `${CANVAS_KEY_PREFIX}${challengeId}:lastActive`;
  const userData = await redis.get(key);
  
  if (!userData) return null;
  
  try {
    return JSON.parse(userData as string);
  } catch (e) {
    return null;
  }
}

// Get all users who participated in a challenge
export async function getChallengeUsers(
  redis: any,
  challengeId: string
): Promise<Record<string, number> | null> {
  if (!challengeId) {
    throw new Error("Challenge ID is required");
  }
  
  // Pattern to match all user keys for this challenge
  const pattern = `${CANVAS_KEY_PREFIX}${challengeId}:users:*`;
  const keys = await redis.keys(pattern);
  
  if (!keys || keys.length === 0) return null;
  
  const result: Record<string, number> = {};
  
  for (const key of keys) {
    // Extract username from the key
    const username = key.replace(`${CANVAS_KEY_PREFIX}${challengeId}:users:`, '');
    const timestamp = await redis.get(key);
    if (timestamp) {
      result[username] = parseInt(timestamp as string, 10);
    }
  }
  
  return result;
}
