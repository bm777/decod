import { Devvit, useState, useInterval, useAsync } from '@devvit/public-api';
import { PixelText } from './PixelText.js';
import { 
  getCanvas, 
  placePixel, 
  createNewChallenge,
  saveWords,
  getWords
} from '../logic/canvas.js';
import { decodeWordMatrix } from '../logic/decodeMatrix.js';

const GRID_SIZE = 21;
const PIXEL_SIZE = 15; // pixel size in px

export function CanvasView({ 
  context, 
  onClose,
  challengeId 
}: { 
  context: Devvit.Context, 
  onClose: () => void,
  challengeId: string
}): JSX.Element {
  const { redis, useChannel, ui } = context;
  const [canvas, setCanvas] = useState<number[][]>(async () => {
    const loadedCanvas = await getCanvas(redis, challengeId);
    return loadedCanvas || createEmptyCanvas();
  });
  const [selectedColor, setSelectedColor] = useState(1); // 0=white, 1=black
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [words, setWords] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [localChallengeId, setLocalChallengeId] = useState<string | null>(challengeId);
  
  // Create a unique session ID for this user
  const [sessionId] = useState(() => {
    return Math.random().toString(36).substring(2, 10);
  });
  
  // Set up the cooldown timer using useInterval
  const cooldownTimer = useInterval(() => {
    if (cooldownTime <= 1) {
      cooldownTimer.stop();
      setCooldown(false);
      setCooldownTime(0);
    } else {
      setCooldownTime(cooldownTime - 1);
    }
  }, 1000);
  
  type PixelMessage = {
    x: number;
    y: number;
    color: number;
    session: string;
    challengeId: string;
  };
  
  type WordsMessage = {
    words: Record<string, string>;
    session: string;
    challengeId: string;
    type: 'words';
  };
  
  // Set up real-time channel
  const channel = useChannel<PixelMessage | WordsMessage>({
    name: 'decod_canvas',
    onMessage: (msg) => {
      // Skip messages from self
      if (msg.session === sessionId) return;
      
      // Skip messages for other challenges
      if (msg.challengeId !== challengeId) return;
      
      // Handle words update message
      if ('type' in msg && msg.type === 'words') {
        setWords(msg.words);
        return;
      }
      
      // Handle pixel update message
      if (!('type' in msg)) {
        const newCanvas = [...canvas];
        newCanvas[msg.y][msg.x] = msg.color;
        setCanvas(newCanvas);
      }
    },
  });

  channel.subscribe();

  // Load initial words on component mount
  const { data: loadedWords } = useAsync(async () => {
    return await getWords(redis, challengeId);
  }, {
    depends: { challengeId },
    finally: () => {
      if (loadedWords) {
        setWords(loadedWords);
      }
    }
  });

  function createEmptyCanvas(): number[][] {
    return Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
  }

  async function handlePixelClick(x: number, y: number) {
    if (cooldown) return;

    // Show debugging toast for API calls
    ui.showToast({
      text: `Placed pixel at (${x},${y}) with color ${selectedColor}`,
      appearance: "success"
    });

    // Update canvas
    const newCanvas = [...canvas];
    newCanvas[y][x] = selectedColor;
    setCanvas(newCanvas);
    
    try {
      // Save to Redis and broadcast to other users
      await placePixel(redis, x, y, selectedColor, challengeId);
      
      // Send real-time update to other users
      await channel.send({
        x,
        y,
        color: selectedColor,
        session: sessionId,
        challengeId: challengeId,
      });
      
      // Start cooldown
      setCooldown(true);
      setCooldownTime(5); // 5 for testing. for prod, set to 30
      cooldownTimer.start();
      
      // Check for words after placing
      if (localChallengeId) {
        checkForWords(newCanvas);
      }
    } catch (error) {
      // Add error handling to help debug issues
      console.error("Error placing pixel:", error);
      ui.showToast({
        text: `Error placing pixel: ${error instanceof Error ? error.message : String(error)}`,
        appearance: "neutral"
      });
    }
  }
  
  async function checkForWords(canvasData: number[][]) {
    try {
      setApiError(null);
      
      ui.showToast({
        text: "Processing word detection...",
        appearance: "neutral"
      });
      
      // Use local function instead of API call
      const result = decodeWordMatrix(canvasData);
      setWords(result);
      
      // Save words to Redis
      await saveWords(redis, result, challengeId);
      
      // Broadcast words to other users
      await channel.send({
        words: result,
        session: sessionId,
        challengeId: challengeId,
        type: 'words'
      });
      
      ui.showToast({
        text: `Found ${Object.keys(result).length} possible words`,
        appearance: "success"
      });
    } catch (error) {
      const errorMsg = `Error processing words: ${error instanceof Error ? error.message : String(error)}`;
      console.error("Word detection error:", errorMsg);
      setApiError(errorMsg);
      ui.showToast({
        text: errorMsg,
        appearance: "neutral"
      });
    }
  }
  
  // Add function to create a new challenge
  async function handleCreateChallenge() {
    // Create a new challenge
    const newChallengeId = await createNewChallenge(redis);
    setLocalChallengeId(newChallengeId);
    
    // Reset canvas
    setCanvas(createEmptyCanvas());
    setWords({});
    
    ui.showToast({
      text: `Created Challenge #${newChallengeId}`,
      appearance: "success"
    });
  }

  // Check if there are valid words
  const hasValidWords = Object.values(words).includes("true");
  
  // Get only valid words
  const validWords = Object.entries(words)
    .filter(([_, isValid]) => isValid === "true")
    .map(([word]) => word);

  // Render the canvas grid with green highlight when valid words are found
  const renderGrid = () => {
    return (
      <zstack>
        {/* show the a congratulation message if there is a valid word */}
        {validWords.length > 0 && (
          <zstack
            width="100%"
            height="100%"
            alignment="center middle"
          >
            <vstack 
              padding="small" 
              gap="small" 
              backgroundColor="rgba(0, 200, 0, 0.1)"
              cornerRadius="medium"
              border="thin"
              borderColor="green"
            >
              {validWords.slice(0, 1).map(word => (
                <PixelText color="green" size={4}>{word}</PixelText>
              ))}
            </vstack>
          </zstack>
        )}
        <vstack gap="none" border="thick" borderColor={hasValidWords ? "green" : "black"}>
          {canvas.map((row, y) => (
            <hstack gap="none">
              {row.map((pixel, x) => (
                <hstack
                  height={`${PIXEL_SIZE}px`}
                  width={`${PIXEL_SIZE}px`}
                  backgroundColor={pixel === 1 ? (hasValidWords ? 'green' : 'black') : 'white'}
                  border="thin"
                  borderColor="rgba(0, 0, 0, 0.02)"
                  onPress={() => handlePixelClick(x, y)}
                />
              ))}
            </hstack>
          ))}
        </vstack>
        
        {/* Subtle green overlay when valid words are found */}
        {hasValidWords && (
          <vstack 
            width="100%" 
            height="100%"
            border="thick" 
            borderColor="green"
          />
        )}
      </zstack>
    );
  };

  // Render word results with a fixed layout (4 rows max, 4 words per row max)
  const renderWords = () => {
    if (Object.keys(words).length === 0) {
      if (apiError) {
        return (
          <vstack gap="small" padding="small" cornerRadius="medium">
            <PixelText color="red" size={1}>{`API ERROR: ${apiError}`}</PixelText>
          </vstack>
        );
      }
      return null;
    }
    
    // Convert words object to array of entries
    const wordsArray = Object.entries(words);
    
    // Create a fixed layout: up to 4 rows with up to 4 words per row
    // If there are more than 16 words, only show the first 16
    const rows: Array<Array<[string, string]>> = [];
    const wordsPerRow = 4;
    const maxRows = 4;
    const maxWords = wordsPerRow * maxRows;
    
    const limitedWordArray = wordsArray.slice(0, maxWords);
    
    for (let i = 0; i < Math.min(maxRows, Math.ceil(limitedWordArray.length / wordsPerRow)); i++) {
      rows.push(limitedWordArray.slice(i * wordsPerRow, (i + 1) * wordsPerRow));
    }
    
    return (
      <vstack width="100%" alignment="center middle" gap="small" padding="small">
        {rows.map(row => (
          <hstack gap="medium" alignment="center middle">
            {row.map(([word, isValid], index, arr) => (
              <hstack alignment="center middle">
                <PixelText 
                  color={isValid === "true" ? "green" : "black"} 
                  size={1.8}
                >
                  {word}
                </PixelText>
                {index < arr.length - 1 && <PixelText color="black" size={1.5}> - </PixelText>}
              </hstack>
            ))}
          </hstack>
        ))}
      </vstack>
    );
  };

  return (
    <zstack width="100%" height="100%">
      {/* Color selectors */}
      <vstack gap="medium" padding="large" width="100px" height="100%" alignment="start middle">
        {/* Simplified color selectors */}
        <hstack 
          height="25px"
          width="25px"
          border="thick"
          borderColor="black"
          backgroundColor="white"
          onPress={() => setSelectedColor(0)}
          alignment="center middle"
        >
          {selectedColor === 0 && (
            <text color="black" weight="bold" size="xxlarge">✓</text>
          )}
        </hstack>
        
        <hstack 
          height="25px"
          width="25px"
          border="thick"
          borderColor="black"
          backgroundColor="black"
          onPress={() => setSelectedColor(1)}
          alignment="center middle"
        >
          {selectedColor === 1 && (
            <text color="white" weight="bold" size="xxlarge">✓</text>
          )}
        </hstack>
      </vstack>
      
      {/* Main content */}
      <vstack gap="medium" width="100%" height="100%" alignment="center">
        <spacer height="5px" />
        <PixelText color="black" size={3}>
          {localChallengeId ? `CHALLENGE #${localChallengeId}` : 'PIXEL CANVAS'}
        </PixelText>

        <spacer height="5px" />
        {renderGrid()}

        {/* Words section with arrows */}
        <zstack height="90px" width="100%" backgroundColor='rgba(115, 113, 252)' alignment="center middle">
          {renderWords()}
        </zstack>
    </vstack>

      {/* Back */}
      <zstack
        padding="medium"
        minHeight="30px"
        minWidth="100%"
        alignment="top end"
      >
        <zstack
          minHeight="30px"
          minWidth="80px"
          border="thick"
          borderColor="black"
          onPress={onClose}
          backgroundColor="rgba(115, 113, 252)"
          alignment="center middle"
        >
          <PixelText color="black" size={1.5}>BACK</PixelText>
        </zstack>
      </zstack>
      
      {/* cooldown timer */}
      {cooldown && (
        <zstack
          padding="small"
          minHeight="40px"
          minWidth="60px"
          border="thick"
          borderColor="black"
          backgroundColor="rgba(255, 100, 100, 0.85)"
          cornerRadius="full"
          alignment="center middle"
        >
          <PixelText color="white" size={2}>{cooldownTime + "s"}</PixelText>
        </zstack>
      )}

    </zstack>
  );
}
