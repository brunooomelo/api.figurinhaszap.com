import sharp from "sharp";

export const getMetadata = (imageBuffer: Buffer | string) =>
  sharp(imageBuffer).metadata();

import path from "path";
export const compressImage = async (
  image: Buffer,
  filename: string
): Promise<null | { buffer: Buffer; extension: string, name: string, mimetype: string }> => {
  const metadata = await getMetadata(image);
  let file = null;
  const isLess =
    (metadata.width && metadata.width <= 500) ||
    (metadata.height && metadata.height <= 500);

  const extension = path.extname(filename);
  const isGIF = extension === ".gif";
  const isPNG = extension === ".png";
  const isJPEG = extension === ".jpeg";
  const data = isPNG
    ? {
        extension: ".png",
        name: "figurinha.png",
        mimetype: 'image/png'
      }
    : isGIF
    ? {
        extension: ".gif",
        name: "figurinha.gif",
        mimetype: 'image/gif'
      }
    : {
        extension: ".webp",
        name: "figurinha.webp",
        mimetype: 'image/webp'
      };

  if (isGIF) {
    if (!isLess) {
      file = await sharp(image, { animated: true })
        .sharpen()
        .resize(500, 500, {
          fit: "inside",
        })
        .gif({ effort: 8, delay: 100 });
    } else {
      file = await sharp(image, { animated: true }).sharpen().gif();
    }
  }
  if (isJPEG) {
    if (isLess) {
      file = await sharp(image, { animated: false })
        .sharpen()
        .webp({ quality: 8 });
    } else {
      file = await sharp(image, { animated: false })
        .sharpen()
        .resize(500, 500, {
          fit: "inside",
        })
        .webp({ quality: 8 });
    }
  }

  if (isPNG) {
    file = await sharp(image, { animated: true })
      .resize(500, 500, {
        fit: "inside",
      })
      .png({
        progressive: true,
        force: false,
      });
  }

  if (!file) return null;

  return {
    buffer: await file.toBuffer(),
    ...data
  };
};
