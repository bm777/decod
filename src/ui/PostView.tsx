import { Devvit, useState } from '@devvit/public-api';
import { CanvasView } from './canvasView.js';
import { LeaderboardView } from './LeaderboardView.js';
import { HelpView } from './HelpView.js';
import { PixelText } from './PixelText.js';
import { getCurrentChallengeId, createNewChallenge } from '../logic/canvas.js';


export function postView({ context }: { context: Devvit.Context }): JSX.Element {
  const { redis, ui, reddit, postId } = context;
  
  // if this post is a challenge post by getting its title
  const [challengeIdFromTitle, setChallengeIdFromTitle] = useState<string | null>(async () => {
    try {
      if (!postId) return null;
      
      // Get the post title
      const post = await reddit.getPostById(postId);
      const title = post?.title || '';
      
      // Check if title contains challenge ID
      const match = title.match(/Challenge #(\d+)/i);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Error getting post title:", error);
      return null;
    }
  });
  
  // Initialize state based on whether this is a challenge post
  const [state, setState] = useState(challengeIdFromTitle ? "canvas" : "home");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(challengeIdFromTitle);
  
  const onClose = () => {
    setState('home');
  }
  
  // Function to handle + JOIN button click - directly join latest challenge
  const handleJoin = async () => {
    try {
      // Get the current challenge ID (latest challenge)
      const latestChallengeId = await getCurrentChallengeId(redis);
      
      // Set the selected challenge ID and go to canvas
      setSelectedChallengeId(latestChallengeId);
      setState('canvas');
    } catch (error) {
      ui.showToast({
        text: "Failed to join challenge",
        appearance: "neutral"
      });
    }
  };
  
  // Function to create a new challenge and post it
  const handleNewChallenge = async () => {
    try {
      // Step 1: Create a new challenge in Redis
      const newChallengeId = await createNewChallenge(redis);
      
      // Step 2: Create a new post in r/decod for this challenge
      const currentSubreddit = await reddit.getCurrentSubredditName();
      const newPost = await reddit.submitPost({
        title: `Decod Challenge #${newChallengeId}`,
        subredditName: currentSubreddit || "decod",
        preview: (
          <vstack padding="medium" alignment="center middle">
            <image
              imageWidth={2048}
              imageHeight={1024} 
              height="100%"
              width="100%"
              url="decod-93.png"
              description="Decod"
              resizeMode="cover"
            />
            <PixelText color="white" size={3}>
              {`CHALLENGE #${newChallengeId}`}
            </PixelText>
            <text>Loading challenge canvas..</text>
          </vstack>
        )
      });
      
      ui.showToast({
        text: `Created Challenge #${newChallengeId}! Opening new post...`,
        appearance: "success"
      });
      
      // Step 3: IMPORTANT - Navigate to the new post instead of staying on the current one
      if (newPost?.id) {
        // Open the post in a new tab/window
        ui.navigateTo(`https://reddit.com${newPost.permalink}`);
      } else {
  
      }
      
    } catch (error) {
      ui.showToast({
        text: "Failed to create new challenge post",
        appearance: "neutral"
      });
      console.error("Error creating challenge:", error);
    }
  };

  return (
    <zstack height="100%" width="100%" alignment='top start'>
      {/* Background image */}
      <image
        imageWidth={2048}
        imageHeight={1024} 
        height="100%"
        width="100%"
        url="decod-93.png"
        description="Illusion background for decod"
        resizeMode="cover"
      />

      {/* Main content area */}
      <vstack width="100%" height="100%" alignment="center middle">

        {
          state === 'canvas' && (
            <vstack height="100%" width="100%" alignment="center middle">
              <CanvasView 
                context={context} 
                onClose={onClose}
                challengeId={selectedChallengeId || ''}
              />
            </vstack>
          )
        }
        {
          state === 'leaderboard' && (  
            <vstack height="100%" width="100%" alignment="center middle">
              <LeaderboardView 
                context={context} 
                onClose={onClose}
              />
            </vstack>
          )
        }
        {
          state === 'help' && (
            <zstack height="100%" width="100%" alignment="top start">
              <HelpView context={context} onClose={onClose} />
            </zstack>
          )
        }
        
        {
          state === 'home' && (
            <vstack 
              width="100%"
              height="100%"
              gap="small" 
              padding="large"
              alignment="center middle"
            >
              <vstack 
                padding="medium"
                alignment="center middle"
              >
                <PixelText
                  color="black"
                  size={4}
                >
                  decod
                </PixelText>
              </vstack> 
              
              <vstack
                minHeight={"50px"}
                minWidth={"220px"}
                border="thick"
                borderColor="black"
                onPress={handleJoin}
                backgroundColor={'rgba(0, 0, 0)'}
                alignment="center middle"
              >
                <PixelText
                  color="white"
                  size={2}
                >
                  + JOIN
                </PixelText>
              </vstack>
              
              <vstack
                minHeight={"50px"}
                minWidth={"220px"}
                border="thick"
                borderColor="black"
                onPress={handleNewChallenge}
                backgroundColor={'rgba(115, 113, 252)'}
                alignment="center middle"
              >
                <PixelText
                  color="black"
                  size={2}
                >
                  NEW CHALLENGE
                </PixelText>
              </vstack>
              
              <vstack
                minHeight={"50px"}
                minWidth={"220px"}
                border="thick"
                borderColor="black"
                onPress={() => setState('leaderboard')}
                backgroundColor={'rgba(115, 113, 252)'}
                alignment="center middle"
              >
                <PixelText
                  color="black"
                  size={2}
                >
                  LEADERBOARD
                </PixelText>
              </vstack>
              
              <vstack
                minHeight={"50px"}
                minWidth={"220px"}
                border="thick"
                borderColor="black"
                onPress={() => setState('help')}
                backgroundColor={'rgba(115, 113, 252)'}
                alignment="center middle"
              >
                <PixelText
                  color="black"
                  size={2}
                >
                  HELP?
                </PixelText>
              </vstack>
            </vstack>
          )
        }
      </vstack>
    </zstack>
  );
}
