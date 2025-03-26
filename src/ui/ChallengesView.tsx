import { Devvit, useState } from '@devvit/public-api';
import { PixelText } from './PixelText.js';
import { getAllChallenges, createNewChallenge } from '../logic/canvas.js';

export function ChallengesView({ 
  context, 
  onClose, 
  onSelectChallenge 
}: { 
  context: Devvit.Context, 
  onClose: () => void,
  onSelectChallenge: (challengeId: string) => void 
}): JSX.Element {
  const { redis, ui } = context;
  const [challenges, setChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load challenges initially
  async function loadChallenges() {
    try {
      setLoading(true);
      const allChallenges = await getAllChallenges(redis);
      setChallenges(allChallenges);
    } catch (error) {
      ui.showToast({
        text: "Failed to load challenges",
        appearance: "neutral"
      });
    } finally {
      setLoading(false);
    }
  }

  // Call loadChallenges right away
  loadChallenges();

  async function handleCreateChallenge() {
    try {
      // Create a new challenge
      const newChallengeId = await createNewChallenge(redis);
      
      // Join the newly created challenge
      onSelectChallenge(newChallengeId);
      
      ui.showToast({
        text: `Created Challenge #${newChallengeId}`,
        appearance: "success"
      });
    } catch (error) {
      ui.showToast({
        text: "Failed to create challenge",
        appearance: "neutral"
      });
    }
  }

  return (
    <vstack gap="medium" padding="large" width="100%" height="100%" alignment="center middle">
      <PixelText color="black" size={3}>CHALLENGES</PixelText>
      
      {loading ? (
        <vstack padding="large" alignment="center middle">
          <PixelText color="black" size={2}>LOADING...</PixelText>
        </vstack>
      ) : (
        <vstack 
          gap="medium" 
          padding="medium" 
          cornerRadius="medium" 
          border="thick" 
          borderColor="black"
          backgroundColor="rgba(255, 255, 255, 0.9)"
          width="90%"
          maxHeight="60%"
        >
          {challenges.length === 0 ? (
            <PixelText color="black" size={2}>NO CHALLENGES FOUND</PixelText>
          ) : (
            <vstack gap="small" height="100%">
              {challenges.map((id) => (
                <hstack
                  border="thin"
                  borderColor="black"
                  padding="medium"
                  backgroundColor="rgba(115, 113, 252, 0.2)"
                  onPress={() => onSelectChallenge(id)}
                  cornerRadius="small"
                  alignment="middle center"
                >
                  <PixelText color="black" size={1}>{`CHALLENGE #${id}`}</PixelText>
                </hstack>
              ))}
            </vstack>
          )}
        </vstack>
      )}
      
      <vstack gap="medium">
        <vstack
          minHeight="50px"
          minWidth="220px"
          border="thick"
          borderColor="black"
          onPress={handleCreateChallenge}
          backgroundColor="rgba(0, 0, 0)"
          alignment="center middle"
        >
          <PixelText color="white" size={2}>CREATE CHALLENGE</PixelText>
        </vstack>
        
        <vstack
          minHeight="50px"
          minWidth="220px"
          border="thick"
          borderColor="black"
          onPress={onClose}
          backgroundColor="rgba(115, 113, 252)"
          alignment="center middle"
        >
          <PixelText color="black" size={2}>BACK</PixelText>
        </vstack>
      </vstack>
    </vstack>
  );
}
