import { Devvit, useState } from '@devvit/public-api';
import { PixelText } from './PixelText.js';
import { getLeaderboard } from '../logic/leaderboard.js';

// Define the type for leaderboard entries
type LeaderboardEntry = {
  username: string;
  words: number;
  pixels: number;
  challenges: number;
};

export function LeaderboardView({
  context,
  onClose,
}: {
  context: Devvit.Context;
  onClose: () => void;
}): JSX.Element {
  const { redis, ui, reddit } = context;
  const [currentUser, setCurrentUser] = useState<string>(async () => {
    try {
      const currentUsername = await reddit.getCurrentUsername();
      return currentUsername || '';
    } catch (error) {
      console.error("Error getting username:", error);
      return '';
    }
  });
  console.log('currentUser', currentUser);
  // Add state for user's rank and stats
  const [userRank, setUserRank] = useState<number>(0);
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null);

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(async () => {
    try {
      
      // Get top 10 leaderboard
      const topUsers = await getLeaderboard(redis, 10); 
      
      // Get full leaderboard to find user's position if not in top 10
      const fullLeaderboard = await getLeaderboard(redis, 1000);
      const userRank = fullLeaderboard.findIndex(entry => entry.username === currentUser) + 1;
      const userStats = userRank > 0 ? fullLeaderboard[userRank - 1] : null;
      console.log('userRank', userRank);
      console.log('userStats', userStats);
      
      // Store user's rank and stats separately
      setUserRank(userRank);
      setUserStats(userStats);
      
      return topUsers;
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      ui.showToast({
        text: `Error loading leaderboard data: ${error}`,
        appearance: 'neutral',
      });
      return []; // Return empty array on error
    }
  });

  // Function to determine if this entry is the current user
  const isCurrentUser = (username: string) => username === currentUser;
  
  // Function to render a leaderboard entry
  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number, isUserEntry = false) => (
    <vstack width="100%" key={entry.username}>
      <hstack width="100%" backgroundColor={isCurrentUser(entry.username) ? "#E6F7FF" : undefined}>
        <hstack width="10%">
          <PixelText size={2} color={isUserEntry ? "#FF5733" : "#7371FC"}>
            {`${index + 1}.`}
          </PixelText>
        </hstack>
        <hstack width="40%">
          <PixelText size={2} color={isCurrentUser(entry.username) ? "#FF5733" : "black"}>
            {entry.username}
          </PixelText>
        </hstack>
        <hstack width="20%">
          <PixelText size={2} color="black">
            {entry.words.toString()}
          </PixelText>
        </hstack>
        <hstack width="15%">
          <PixelText size={2} color="black">
            {entry.pixels.toString()}
          </PixelText>
        </hstack>
        <hstack width="15%">
          <PixelText size={2} color="black">
            {entry.challenges.toString()}
          </PixelText>
        </hstack>
      </hstack>
    </vstack>
  );

  return (
    <vstack width="100%" height="100%">
      <spacer height="24px" />

      {/* header */}
      <hstack width="100%" alignment="middle">
        <spacer width="24px" />
        <PixelText size={2.5} color="black">
          Leaderboard
        </PixelText>
        <spacer width="24px" grow />
        <vstack
          minHeight="40px"
          minWidth="40px"
          border="thick"
          borderColor="black"
          backgroundColor="rgba(0, 0, 0)"
          alignment="center middle"
          onPress={onClose}
        >
          <PixelText size={2} color="white">
            x
          </PixelText>
        </vstack>
        <spacer width="24px" />
      </hstack>

      <spacer height="14px" />

      {/* Leaderboard header */}
      <hstack width="100%" padding="medium">
        <spacer width="9px" />
        <vstack grow backgroundColor="white" padding="small">
          <hstack width="100%">
            <hstack width="10%">
              <PixelText size={1.5} color="black">
                Rank
              </PixelText>
            </hstack>
            <hstack width="40%">
              <PixelText size={1.5} color="black">
                Player
              </PixelText>
            </hstack>
            <hstack width="20%">
              <PixelText size={1.5} color="black">
                Words
              </PixelText>
            </hstack>
            <hstack width="15%">
              <PixelText size={1.5} color="black">
                Pixels
              </PixelText>
            </hstack>
            <hstack width="15%">
              <PixelText size={1.5} color="black">
                Challenges
              </PixelText>
            </hstack>
          </hstack>
        </vstack>
        <spacer width="9px" />
      </hstack>

      {/* Leaderboard entries area */}
      <hstack width="100%" grow>
        <spacer width="24px" />
        <vstack width="100%" grow gap="medium" padding="medium" backgroundColor="white">
          {leaderboardData && leaderboardData.length > 0 ? (
            <vstack width="100%" grow gap="medium">
              {/* Top 10 users */}
              {leaderboardData.map((entry, index) => renderLeaderboardEntry(entry, index))}
              
              {/* User's stats if not in top 10 */}
              {userStats && userRank > 10 && (
                <vstack width="100%">
                  <hstack width="100%" padding="small">
                    <PixelText size={1.5} color="black">
                      Your Position
                    </PixelText>
                  </hstack>
                  <spacer height="8px" />
                  <hstack width="100%" backgroundColor="#E6F7FF" padding="small">
                    {renderLeaderboardEntry(userStats, userRank - 1, true)}
                  </hstack>
                </vstack>
              )}
            </vstack>
          ) : (
            <vstack width="100%" alignment="center middle" padding="large">
              <PixelText size={2} color="black">
                No leaderboard data yet!
              </PixelText>
              <spacer height="8px" />
              <PixelText size={1.5} color="#7371FC">
                Place pixels to decode words
              </PixelText>
            </vstack>
          )}
        </vstack>
        <spacer width="24px" />
      </hstack>

      <spacer height="24px" />
    </vstack>
  );
}
