import { v2 as cloudinary } from "cloudinary";
import path from "path";
import chokidar from "chokidar";

const SCRET = "";
const KEY = "";

const img = path.resolve(__dirname, "test.webp");
cloudinary.config({
  cloud_name: "debbupyqo",
  api_key: KEY,
  api_secret: SCRET,
});
const folder = path.resolve(__dirname, "img");
const watcher = chokidar.watch(folder);
const log = console.log.bind(console);

watcher
  .on("add", (path) =>
    cloudinary.uploader
      .upload(path, {
        folder: "production",
      })
      .then((result) => console.log(result))
  )
  .on("unlink", (path) => log(`File ${path} has been removed`))
  .on("raw", (event, path, details) => {
    // internal
    log("Raw event info:", event, path, details);
  });

// cloudinary.uploader
//   .upload(img, {
//     folder: "production",
//   })
//   .then((result) => console.log(result));
