import sharp from "sharp";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { environments } from "./environment";

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: environments.headless,
    ...(!!environments.executablePath && {
      executablePath: environments.executablePath,
    }),
  },
});

client.on("qr", (qr) => {
  // Generate and scan this code with your phone
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("change_state", console.log);

client.on("message_create", async (msg) => {
  if (msg.body == "!ping") {
    msg.reply("pong");
  }
  // await msg.getChat().then((chat) => chat.delete())
});

export const generateAndSendSticker = async (
  msgFrom: string,
  imageBuffer: string | Buffer,
  stickerName: string
) => {
  const fileSharp = (await sharp(imageBuffer, { animated: true })
    .resize({ height: 512, width: 512, fit: "cover", position: "center" })
    .webp()
    .toBuffer()) as unknown as string;

  const media = new MessageMedia("image/webp", fileSharp, "banner.webp");

  await Promise.race([
    await client
      .sendMessage(msgFrom, "Aguarde o sticker esta sendo gerado...")
      .then((chat) => {
        return client.sendMessage(msgFrom, media, {
          sendMediaAsSticker: true,
          stickerAuthor: "figurinhaszap.com",
          stickerCategories: [],
          stickerName: "",
        });
      })
      .catch(console.log),
    await client
      .sendMessage(
        msgFrom.replace("+", ""),
        "Aguarde o sticker esta sendo gerado..."
      )
      .then(() => {
        return client.sendMessage(msgFrom.replace("+", ""), media, {
          sendMediaAsSticker: true,
          stickerAuthor: "figurinhaszap.com",
          stickerCategories: [],
          stickerName: "",
        });
      })
      .catch(console.log),
  ]);
};

export const sendMessage = async (msgFrom: string, message: string) => {
  await Promise.race([
    await client
      .sendMessage(msgFrom, message)
      .then((chat) => {
        return chat.delete();
      })
      .catch(console.log),

    await client
      .sendMessage(msgFrom.replace("+", ""), message)
      .then((chat) => {
        return chat.delete();
      })
      .catch(console.log),
  ]);
};
export const ClientInitialize = () => client.initialize();
