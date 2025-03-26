import { Devvit } from '@devvit/public-api';
import { postView } from './ui/PostView.js';

// Configure Devvit with all the APIs we need
Devvit.configure({
  redditAPI: true,
  redis: true,
  media: true,
  realtime: true,
  http: true,
});

// Register the post view using addCustomPostType
Devvit.addCustomPostType({
  name: 'Decod',
  description: 'Place pixel, decode the message',
  height: 'tall',
  render: (context) => postView({ context }),
});

// If you want to add a menu item in the subreddit context:
Devvit.addMenuItem({
  location: 'subreddit',
  label: 'Start a new puzzle post!',
  onPress: async (_, context) => {
    const currentSubreddit = await context.reddit.getCurrentSubredditName();

    // Example: Create a new post using block-based UI
    await context.reddit.submitPost({
      title: `New Decodr on r/${currentSubreddit}`,
      subredditName: currentSubreddit,
      preview: (
        <vstack>
          <text>Check out the puzzle in the post body!</text>
        </vstack>
      ),
    });
    context.ui.showToast(`Puzzle post created in r/${currentSubreddit}!`);
  },
});

export default Devvit;
