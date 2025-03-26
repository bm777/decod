import { Devvit } from '@devvit/public-api';
import { PixelText } from './PixelText.js';

export function HelpView({ context, onClose }: { context: Devvit.Context, onClose: () => void }): JSX.Element {
  return (
    <vstack width="100%" height="100%">
      <spacer height="24px" />

      {/* header */}
      <hstack width="100%" alignment="middle">
        <spacer width="24px" />
        <PixelText size={2.5} color='black'>
          How to play
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
          // cornerRadius='small'
        >
          <PixelText size={2} color='white'>
            x
          </PixelText>
        </vstack>
        <spacer width="24px" />
      </hstack>

      <spacer height="20px" />

      {/* body */}
      <hstack width="100%" grow>
        <spacer width="24px" />
        <vstack grow backgroundColor='white' alignment="center middle" gap="medium">
          <vstack alignment="center middle">
            <PixelText size={3} color='black'>
              Place a pixel 
            </PixelText>
            <spacer height="4px" />
            <PixelText size={3} color='black'>
              with other
            </PixelText>
          </vstack>
          
          <vstack alignment="center middle">
            <PixelText size={2} color='#07495F'>
              Earn points if you
            </PixelText>
            <spacer height="4px" />
            <PixelText size={2} color='#07495F'>
              decrypt a word
            </PixelText>
          </vstack>
        </vstack>
        <spacer width="24px" />
      </hstack>

      <spacer height="24px" />
      
    </vstack>
  );
}