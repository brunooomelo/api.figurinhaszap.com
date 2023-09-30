import qrcode from "qrcode-terminal";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { environments } from "./environment";
import { prisma } from "./prisma";
import { upload } from "./cloudinary";
import fs from "fs";
import { promisify } from "util";

const removeImage = promisify(fs.unlink);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
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

client.on("message", async (msg) => {
  if (msg.body.startsWith(".")) {
    const command = msg.body.slice(1).trim().split(/ +/).shift()?.toLowerCase();
    const [action, id] = msg.body.trim().split(" ").slice(1);

    console.log(msg, msg.fromMe)
    if (command === "r" && !msg.fromMe) {
      if (!action || !id) return;
      if (["approve", "reject"].includes(action)) {
        const fileRequest = await prisma.request.findFirst({
          where: { id },
        });
        if (!fileRequest) return;
        if (action === "approve") {
          const response = await upload(fileRequest.name);
          await msg.reply(`APROVADO\n
          ID: ${response?.public_id}\n
          URL: ${response?.url}`);
          return;
        }

        await removeImage(fileRequest.name);

        await msg.reply(`APAGADO\n
        PATH: ${fileRequest.name}`);
        return;
      }
    }
  }
  const chat = await msg.getChat();
  await chat.delete();
});

client.on("authenticated", () => {
  console.log("© Figurinhas Bot Autenticado");
});

client.on("auth_failure", function () {
  console.error("© Figurinhas Bot Falha na autenticação");
});

client.on("change_state", (state) => {
  console.log("© Figurinhas Bot Status de conexão: ", state);
});

client.on("disconnected", (reason) => {
  console.log("© Figurinhas Bot Cliente desconectado", reason);
  client.initialize();
});

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
  media: MessageMedia,
  stickerName: string,
  destination: string
) => {
  try {
  

    await client
      .sendMessage(msgFrom, media, {
        sendMediaAsSticker: true,
        stickerAuthor: "figurinhaszap.com",
        stickerCategories: [],
        stickerName,
      })
      .then((message) => message.getChat().then((chat) => chat.delete()));

      const request = await prisma.request.upsert({
        where: {
          name: destination,
        },
        create: {
          name: destination,
        },
        update: {},
      });

      console.log(destination)
      await client
      .sendMessage("120363165490925135@g.us", media, {
        sendMediaAsSticker: true,
        stickerAuthor: "figurinhaszap.com",
        stickerCategories: [],
        stickerName,
      })
      .then((chat) =>
        chat.reply(
          `Aprovar:\n.r approve ${request.id}\n\n\nRejeitar:\n.r reject ${request.id}`
        )
      );
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

export const sendImageMessage = async (
  msgFrom: string,
  imagePath: string,
  message: string
) => {
  const media = MessageMedia.fromFilePath(imagePath);
  return client.sendMessage(msgFrom, media, { caption: message });
};

export const ClientInitialize = () => client.initialize();
