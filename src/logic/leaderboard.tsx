import { Devvit } from '@devvit/public-api';

const LEADERBOARD_KEY_PREFIX = 'decod:leaderboard:';

// Increment word count for a user when they place the final pixel for a valid word
export async function incrementUserWordCount(
  redis: any,
  username: string,
  wordCount: number = 1
): Promise<void> {
  if (!username) return;
  
  const key = `${LEADERBOARD_KEY_PREFIX}words:${username}`;
  
  // Get current count
  const currentCountStr = await redis.get(key);
  const currentCount = currentCountStr ? parseInt(currentCountStr as string, 10) : 0;
  
  // Increment and save
  await redis.set(key, (currentCount + wordCount).toString());
  
  // Add user to the leaderboard set
  await addUserToLeaderboardSet(redis, username);
}

// Increment pixel count for a user
export async function incrementUserPixelCount(
  redis: any,
  username: string,
  pixelCount: number = 1
): Promise<void> {
  if (!username) return;
  
  const key = `${LEADERBOARD_KEY_PREFIX}pixels:${username}`;
  
  // Get current count
  const currentCountStr = await redis.get(key);
  const currentCount = currentCountStr ? parseInt(currentCountStr as string, 10) : 0;
  
  // Increment and save
  await redis.set(key, (currentCount + pixelCount).toString());
  
  // Add user to the leaderboard set
  await addUserToLeaderboardSet(redis, username);
}

// Track which challenges a user has participated in
export async function trackUserChallenge(
  redis: any,
  username: string,
  challengeId: string
): Promise<void> {
  if (!username || !challengeId) return;
  
  const key = `${LEADERBOARD_KEY_PREFIX}challenges:${username}`;
  
  // Get current challenges
  const currentChallengesStr = await redis.get(key);
  let challenges: string[] = [];
  
  if (currentChallengesStr) {
    try {
      challenges = JSON.parse(currentChallengesStr as string);
    } catch (e) {
      challenges = [];
    }
  }
  
  // Only add if not already present
  if (!challenges.includes(challengeId)) {
    challenges.push(challengeId);
  }
  
  // Save the updated challenges array
  await redis.set(key, JSON.stringify(challenges));
  
  // Add user to the leaderboard set
  await addUserToLeaderboardSet(redis, username);
}

// Get leaderboard data
export async function getLeaderboard(
  redis: any,
  limit: number = 10
): Promise<Array<{username: string, words: number, pixels: number, challenges: number}>> {
  try {
    // This is the set we'll use to store all known users who have placed pixels
    const usersSetKey = `${LEADERBOARD_KEY_PREFIX}users_set`;
    
    // For now, we'll try to get the users set if it exists
    const usersJsonStr = await redis.get(usersSetKey);
    
    let users: string[] = [];
    if (usersJsonStr) {
      try {
        users = JSON.parse(usersJsonStr as string);
      } catch (e) {
        console.error('Error parsing users set:', e);
        users = [];
      }
    } else {
      console.log('No users set found');
    }
    
    // If we have no users yet, return empty array
    if (users.length === 0) {
      return [];
    }
    
    // Get data for each user
    const leaderboardData: Array<{username: string, words: number, pixels: number, challenges: number}> = [];
    
    for (const username of users) {
      // Get word count
      const wordKey = `${LEADERBOARD_KEY_PREFIX}words:${username}`;
      const wordCountStr = await redis.get(wordKey);
      const wordCount = wordCountStr ? parseInt(wordCountStr as string, 10) : 0;
      
      // Get pixel count
      const pixelKey = `${LEADERBOARD_KEY_PREFIX}pixels:${username}`;
      const pixelCountStr = await redis.get(pixelKey);
      const pixelCount = pixelCountStr ? parseInt(pixelCountStr as string, 10) : 0;
      
      // Get challenge count
      const challengeKey = `${LEADERBOARD_KEY_PREFIX}challenges:${username}`;
      const challengesStr = await redis.get(challengeKey);
      let challengeCount = 0;
      
      if (challengesStr) {
        try {
          const challenges = JSON.parse(challengesStr as string);
          challengeCount = challenges.length;
        } catch (e) {
          challengeCount = 0;
        }
      }
      
      // Only add users who have at least some activity
      if (wordCount > 0 || pixelCount > 0 || challengeCount > 0) {
        leaderboardData.push({
          username,
          words: wordCount,
          pixels: pixelCount,
          challenges: challengeCount
        });
      }
    }
    
    // Sort by word count (primary), then by pixel count (secondary)
    leaderboardData.sort((a, b) => {
      if (b.words !== a.words) return b.words - a.words;
      return b.pixels - a.pixels;
    });
    
    // Return limited number of results
    return leaderboardData.slice(0, limit);
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    return [];
  }
}

// Add this new function to track users in the set
export async function addUserToLeaderboardSet(
  redis: any,
  username: string
): Promise<void> {
  if (!username) return;
  
  const usersSetKey = `${LEADERBOARD_KEY_PREFIX}users_set`;
  
  // Get current users set
  const usersJsonStr = await redis.get(usersSetKey);
  let users: string[] = [];
  
  if (usersJsonStr) {
    try {
      users = JSON.parse(usersJsonStr as string);
    } catch (e) {
      users = [];
    }
  }
  
  // Only add if not already present
  if (!users.includes(username)) {
    users.push(username);
    // Save the updated users set
    await redis.set(usersSetKey, JSON.stringify(users));
  }
}  