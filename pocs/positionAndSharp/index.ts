// import path from "path";
// import sharp from "sharp";

// console.log(__dirname);
// const world = "./1.jpeg";
// const house = "./2.png";
// const isWorld = false;

// const image = isWorld ? world : house;

// const init = async (prop: {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// }, rotate = 0) => {
//   const metadata = await sharp(path.resolve(__dirname, image)).metadata();

//   const w = prop.width / 100;
//   const h = prop.height / 100;

//   const x = prop.x / 100;
//   const y = prop.y / 100;

//   if (!metadata.height || !metadata.width) return;
//   await sharp(path.resolve(__dirname, image))
//   .rotate(rotate)
//     .extract({

//       left: Math.floor(x * metadata.width),
//       top: Math.floor(y * metadata.height),

//       height: Math.floor(h * metadata.height),
//       width: Math.floor(w * metadata.width),
//     })
//     .resize(512)
//     .toFile(path.resolve(__dirname, "./test.webp"))
//     .catch((e) => {
//       console.log(e);
//     });
// };
// const params = {
//   x: 83.92370572207084,
//   y: 66.66666666666667,
//   width: 16.07629427792916,
//   height: 33.333333333333336,
// };

// const rotate = {
//   "x": 66.66666666666667,
//   "y": 58.03814713896458,
//   "width": 33.333333333333336,
//   "height": 16.076294277929158
// }
// init(
//   {
//     "x": 66.66666666666666,
//     "y": 58.03814713896456,
//     "width": 33.333333333333336,
//     "height": 16.076294277929158
// }

// ,90
// );

import path from "path";
import sharp from "sharp";

console.log(__dirname);
const world = "./1.jpeg";
const house = "./2.png";
const isWorld = false;

// const image = "./profile.png";
const image = house

const init = async (
  prop: { x: number; y: number; width: number; height: number },
  rotate = 0
) => {
  const metadata = await sharp(path.resolve(__dirname, image)).metadata();

  if (!metadata.height || !metadata.width) return;

  let file = await sharp(path.resolve(__dirname, image))

  if (
    (metadata.width && metadata.width > 512) ||
    (metadata.height && metadata.height > 512)
  ) {
    const x = Math.floor((prop.x / 100) * metadata.width);
    const y = Math.floor((prop.y / 100) * metadata.height);
    const width = Math.ceil((prop.width / 100) * metadata.width);
    const height = Math.ceil((prop.height / 100) * metadata.height);
    file.extract({
      left: x,
      top: y,
      width: width,
      height: height,
    });
  }

  // Calcula as coordenadas de porcentagem na imagem original

  // Extrai a área da imagem original
  file
    .toFile(path.resolve(__dirname, "./test.webp"))
    .catch((e) => {
      console.log(e);
    });
};

const params = {
  "x": 0,
  "y": 37.93980013508242,
  "width": 29.93094107926542,
  "height": 62.06019986491758
}

init(params, 0);
