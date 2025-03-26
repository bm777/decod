import { Devvit } from '@devvit/public-api';

export function PlacePixelView({ context }: { context: Devvit.Context }): JSX.Element {
  const selectedColor = 1;

  return (
    <vstack width="100%" height="100%">
        {/* <text>Choose a color and place your pixel</text>
        <hstack gap="medium" padding="small">
          {[1, 2, 3, 4, 5].map((colorId) => (
            <button 
              backgroundColor={getColorFromId(colorId)}
              borderColor={selectedColor === colorId ? "white" : "transparent"}
              borderWidth="medium"
              width="40px" 
              height="40px"
              onPress={() => setSelectedColor(colorId)}
            />
          ))}
        </hstack>
        <text color="white">Click on the canvas to place your pixel</text> */}
    </vstack>
  );
}

function getColorFromId(id: number): string {
  // Map color IDs to actual colors
  const colors = {
    1: "red",
    2: "blue",
    3: "green",
    4: "yellow",
    5: "purple"
  };
  return colors[id as keyof typeof colors] || "black";
}