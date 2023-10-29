import sharp from "sharp";

export const getMetadata = (imageBuffer: Buffer | string) =>
  sharp(imageBuffer).metadata();

import path from "path";
type OptsCompress = {
  isExtracted: boolean;
  y: number;
  x: number;
  width: number;
  height: number;
};

export const compressImage = async (
  image: Buffer,
  extension: string,
  opts: OptsCompress,
): Promise<null | {
  buffer: Buffer;
  extension: string;
  name: string;
  mimetype: string;
}> => {
  let file = null;
  const isGIF = extension === ".gif";
  const isPNG = extension === ".png";
  const data = isPNG
    ? {
        extension: ".png",
        name: "figurinha.png",
        mimetype: "image/png",
      }
    : {
        extension: ".webp",
        name: "figurinha.webp",
        mimetype: "image/webp",
      };

  if (isGIF) {
    file = sharp(image, { animated: true, pages: -1 })
      .extract({
        left: opts.x,
        top: opts.y,
        width: opts.width,
        height: opts.height,
      })
      .sharpen()
      .gif();
  }
  if (!isGIF && !isPNG) {
    file = sharp(image, { animated: false })
      .extract({
        left: opts.x,
        top: opts.y,
        width: opts.width,
        height: opts.height,
      })
      .resize(512, 512, {
        fit: "cover",
      })
      .sharpen()
      .webp();
  }

  if (isPNG) {
    file = sharp(image)
      .extract({
        left: opts.x,
        top: opts.y,
        width: opts.width,
        height: opts.height,
      })
      .resize(512, 512, {
        fit: "cover",
      })
      .sharpen()
      .png({
        progressive: true,
        force: false,
      });
  }

  if (!file) return null;

  return {
    buffer: await file.toBuffer(),
    ...data,
  };
};
