import { v2 as cloudinary } from "cloudinary";
import path from "path";

const SCRET = "";
const KEY = "";

const img = path.resolve(__dirname, "test.webp");
cloudinary.config({
  cloud_name: "debbupyqo",
  api_key: KEY,
  api_secret: SCRET,
});
const folder = path.resolve(__dirname, "img");
const log = console.log.bind(console);

// cloudinary.uploader
//   .upload(img, {
//     folder: "production",
//   })
//   .then((result) => console.log(result));
