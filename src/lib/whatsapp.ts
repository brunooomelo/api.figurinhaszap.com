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
});

client.on("disconnected", () => {});

export const formatBrazilianNumber = async (msgFrom: string) => {
  let to = msgFrom.replace("+", "");
  let contactId;
  if (to.startsWith("+55") && to.length == 14 && to[5] === "9") {
    contactId = await client.getNumberId(to.slice(0, 5) + to.slice(5));
  }

  if (!contactId) {
    contactId = await client.getNumberId(to);
  }

  if (contactId) {
    to = contactId._serialized;
  }
  if (!contactId) {
    throw new Error("Este número não existe");
  }
  return to;
};

export const generateAndSendSticker = async (
  msgFrom: string,
  imageBuffer: Buffer,
  stickerName: string,
  isAnimated = false
) => {
  try {

    const fileSharp = sharp(imageBuffer, { animated: isAnimated })
      .resize({ height: 512, width: 512, fit: "cover", position: "center" })
      if (isAnimated) {
        fileSharp.gif()
      } else {
        fileSharp.webp()
      }
    const imageType = isAnimated
      ? {
          mimetype: "image/gif",
          name: "figurinha.gif",
        }
      : {
          mimetype: "image/webp",
          name: "figurinha.webp",
        };
    const media = new MessageMedia(
      imageType.mimetype,
      (await fileSharp.toBuffer()) as unknown as string,
      imageType.name
    );

    await client
      .sendMessage(msgFrom, media, {
        sendMediaAsSticker: true,
        stickerAuthor: "figurinhaszap.com",
        stickerCategories: [],
        stickerName,
      })
      .then((message) => message.getChat().then((chat) => chat.delete()));
    const chat = await client
      .sendMessage("120363165490925135@g.us", msgFrom.replace("c.us", ""))
      .then((message) =>
        message.reply(media, undefined, {
          sendMediaAsSticker: true,
          stickerAuthor: "figurinhaszap.com",
          stickerCategories: [],
          stickerName,
        })
      );

    await chat.getChat().then((chat) => chat.delete());
  } catch (error) {
    console.log(error);
    if (typeof error === "string") {
      await client
        .sendMessage("120363165490925135@g.us", error)
        .then((message) => message.getChat().then((chat) => chat.delete()));
    } else {
      await client
        .sendMessage("120363165490925135@g.us", (error as Error).message)
        .then((message) => message.getChat().then((chat) => chat.delete()));
    }
  }
};

export const sendMessage = async (msgFrom: string, message: string) => {
  await client
    .sendMessage(msgFrom, message)
    .then((chat) => {
      return chat.delete();
    })
    .catch(console.log);
};

export const ClientInitialize = () => client.initialize();
