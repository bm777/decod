import { Devvit } from '@devvit/public-api';
import { PixelText } from './PixelText.js';

export function LeaderboardView({ context, onClose }: { context: Devvit.Context, onClose: () => void }): JSX.Element {
  const getLeaderboardData = () => {
    // This would be an actual API call in your implementation
    return [
      { username: "Darth_Marko_23", score: 148095 },
      { username: "Old_Timey_Lemon", score: 108100 },
      { username: "madthumbz", score: 102088 },
      { username: "SyrysSylynys", score: 100114 },
      { username: "Coffeenomnom_", score: 96085 },
      { username: "Phalloblaster", score: 58642 },
      { username: "Dreamenjoyer", score: 49816 },
      { username: "i_failure36", score: 43461 },
      { username: "POTUS_King", score: 43354 },
      { username: "Ok_Investment1497", score: 22 },
    ];
  };

  const leaderboardData = getLeaderboardData();

  return (
    <vstack width="100%" height="100%">
      <spacer height="24px" />

      {/* header */}
      <hstack width="100%" alignment="middle">
        <spacer width="24px" />
        <PixelText size={2.5} color='black'>
          Leaderboard
        </PixelText>
        <spacer width="24px" grow />
        <vstack
          minHeight={"40px"}
          minWidth={"40px"}
          border="thick"
          borderColor="black"
          backgroundColor={'rgba(0, 0, 0)'} 
          alignment="center middle"
          onPress={onClose}
        >
          <PixelText size={2} color='white'>
            x
          </PixelText>
        </vstack>
        <spacer width="24px" />
      </hstack>

      <spacer height="20px" />

      {/* Leaderboard entries */}
      <hstack width="100%" grow>
        <spacer width="24px" />
        <vstack width="100%" grow gap="medium" padding="medium" backgroundColor="white">
          {leaderboardData.slice(0, 9).map((entry, index) => (
            <vstack width="100%">
              <hstack width="100%">
                <PixelText size={2} color={"#7371FC"}>
                  {`${index + 1}.`}
                </PixelText>
                <spacer width="8px" />
                <PixelText size={2} color={"black"}>
                  {entry.username}
                </PixelText>
                <spacer grow />
                <PixelText size={2} color="black">
                  {`${entry.score.toString()} *`}
                </PixelText>
              </hstack>
            </vstack>
          ))}
          {/* Special entry for last place with divider line */}
          {leaderboardData.length > 9 && (
            <vstack width="100%">
              <hstack width="100%" height="2px" backgroundColor="#BBBBBB" />
              <spacer height="8px" />
              <hstack width="100%" backgroundColor="white">
                <PixelText size={2} color="#7371FC">
                  100097.
                </PixelText>
                <spacer width="8px" />
                <PixelText size={2} color="#7371FC">
                  {leaderboardData[9].username}
                </PixelText>
                <spacer grow />
                <PixelText size={2} color="black">
                  {`${leaderboardData[9].score.toString()} *`}
                </PixelText>
              </hstack>
            </vstack>
          )}
        </vstack>
        <spacer width="24px" />
      </hstack>

      <spacer height="24px" />
    </vstack>
  );
}
