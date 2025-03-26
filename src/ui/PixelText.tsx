import { Devvit } from "@devvit/public-api";
import { Glyphs, PixelTextProps, SupportedGlyphs, Glyph } from "../fonts/Glyphs.js";

export function PixelText(props: PixelTextProps): JSX.Element {
    const { children, size = 2, color = 'black' } = props;
    const line = children[0].split('');
    const gap = 1;
    const height = Glyphs['A'].height;
    let width = 0;
    let xOffset = 0;
  
    const characters: string[] = [];
  
    line.forEach((character) => {
      if (character === ' ') {
        xOffset += 6 + gap;
        return;
      }
  
      const glyph: Glyph = Glyphs[character as SupportedGlyphs];
      if (!glyph) {
        return;
      }
      
      characters.push(`<path
        d="${glyph.path}"
        transform="translate(${xOffset} 0)"
        fill-rule="evenodd"
        clip-rule="evenodd"
      />`);
  
      xOffset += glyph.width + gap;
      width = xOffset;
    });
  
    // Remove the trailing gap
    width -= gap;
  
    const scaledHeight: Devvit.Blocks.SizeString = `${height * size}px`;
    const scaledWidth: Devvit.Blocks.SizeString = `${width * size}px`;
  
    return (
      <image
        imageHeight={height}
        imageWidth={width}
        height={scaledHeight}
        width={scaledWidth}
        description={children[0]}
        resizeMode="fill"
        url={`data:image/svg+xml;charset=UTF-8,
          <svg
              width="${width}"
              height="${height}"
              viewBox="0 0 ${width} ${height}"
              fill="${color}"
              xmlns="http://www.w3.org/2000/svg"
          >
          ${characters.join('')}
          </svg>
        `}
      />
    );
  }