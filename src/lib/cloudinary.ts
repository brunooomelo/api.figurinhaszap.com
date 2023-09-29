import { v2 as cloudinary } from "cloudinary";
import { environments } from "./environment";

cloudinary.config({
  cloud_name: "figurinhaszap",
  api_key: environments.cloudinaryKey,
  api_secret: environments.cloudinarySecret,
});

export const upload = (path: string) => {
  return cloudinary.uploader.upload(path, {
    folder: "production",
  }).catch(console.log)
};
