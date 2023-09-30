import path from "path";
import sharp from "sharp";

const image = "1.gif";
// const image = "3.jpeg";

const init = async (
  prop: { x: number; y: number; width: number; height: number },
  rotate = 0
) => {
  const metadata = await sharp(path.resolve(__dirname, image)).metadata();
  console.log(metadata)
  
  if (!metadata.height || !metadata.width) return;
  
  let file = await sharp(path.resolve(__dirname, image),{ animated: true }).sharpen().resize(500, 500, {
    fit: 'inside'
  }).gif()
  
  // console.log(file.info)
  const metadatabuffer = await sharp(await file.toBuffer()).metadata();
  console.log(metadatabuffer)
  
  await file
    .toFile(path.resolve(__dirname, "./output/"+image))
    .catch((e) => {
      console.log(e);
    });
};

const params = {
  x: 0,
  y: 37.93980013508242,
  width: 29.93094107926542,
  height: 62.06019986491758,
};

init(params, 0);
