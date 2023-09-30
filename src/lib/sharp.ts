import sharp from "sharp";

export const getMetadata = (imageBuffer: Buffer| string) => sharp(imageBuffer).metadata();