export type ImageMetadata = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const CalculateExtract = (
  config: ImageMetadata,
  metadata: Pick<ImageMetadata, "width" | "height">,
) => {
  return {
    x: Math.floor((config.x / 100) * metadata.width),
    y: Math.floor((config.y / 100) * metadata.height),
    width: Math.floor((config.width / 100) * metadata.width),
    height: Math.floor((config.height / 100) * metadata.height),
  };
};
