import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import { CanvasEmoji } from "canvas-emoji";
import fs from "fs";

const width: number = 400;
const height: number = 400;

export const generateImage = async (soulName: string): Promise<Buffer> => {
  // create canvas and ctx
  const canvas: Canvas = createCanvas(width, height);
  const context2D: CanvasRenderingContext2D = canvas.getContext("2d");

  // draw background
  context2D.fillStyle = "#fff";
  context2D.fillRect(0, 0, width, height);

  // load emoji lib
  const canvasEmoji = new CanvasEmoji(context2D);

  // draw soulname string with embedded emojis
  canvasEmoji.drawPngReplaceEmoji({
    emojiH: 24,
    emojiW: 24,
    fillStyle: "#000",
    font: "32px serif",
    x: 50,
    y: 50,
    text: soulName,
  });

  // create buffer from image
  const buffer = canvas.toBuffer("image/png");

  // output the file somewhere where we can see it
  fs.mkdirSync("tmp", { recursive: true });
  fs.writeFileSync(`tmp/${soulName}.png`, buffer);

  return buffer;
};
