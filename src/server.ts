import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import {
  ClientClose,
  ClientInitialize,
  formatBrazilianNumber,
  generateAndSendSticker,
  sendImageMessage,
  sendMessage,
} from "./lib/whatsapp";
import { environments } from "./lib/environment";
import fastifyMultipart from "@fastify/multipart";
import sharp from "sharp";
import path from "path";
import { prisma } from "./lib/prisma";
import { generateToken } from "./utils/generateToken";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { generateMessageWithToken, message } from "./utils/generateMessage";
import { randomUUID } from "crypto";
import { compressImage, getMetadata } from "./lib/sharp";
import { MessageMedia } from "whatsapp-web.js";

const app = fastify();

app.register(fastifyCors, { origin: "*" });
app.register(fastifyMultipart, {
  limits: {
    fileSize: 1_048_576 * 5, // 25mb
  },
  attachFieldsToBody: true,
});

const PLATFORM_NAME = "Figurinhaszap";

const formatPhoneForWhatsapp = (phone: string) =>
  `${phone.replace("+", "")}@c.us`;

app.post("/stickers", async (request, reply) => {
  try {
    const data = await (request.body as unknown as any).file;

    const body = Object.fromEntries(
      Object.keys(request.body as any).map((key) => [
        key,
        (request.body as any)[key].value,
      ]),
    );

    const bodySchema = z.object({
      x: z.coerce.number(),
      y: z.coerce.number(),
      width: z.coerce.number(),
      height: z.coerce.number(),
      name: z.string().nullable(),
    });

    const { x, y, name, width, height } = bodySchema.parse(body);
    const token = request.headers["x-auth-token"] as string;
    if (!token) {
      return reply.status(401).send({ error: "Você não está autenticado." });
    }

    const jwtData = (await new Promise((resolve, reject) =>
      jwt.verify(token, environments.secret, {}, async (err, data) => {
        if (err) {
          reject("Você não esta autenticado. Por favor entre com seu whatsapp");
          return;
        }
        resolve(data as { id: string });
      }),
    )) as { id: string };

    if (!jwtData?.id) {
      return reply.status(401).send({
        error: "Você não esta autenticado. Por favor entre com seu whatsapp",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: jwtData.id,
      },
    });

    if (!user) {
      return reply.status(401).send({
        error: "Você não esta autenticado. Por favor entre com seu whatsapp",
      });
    }

    if (!data) {
      return reply.status(400).send({ error: "Não foi enviado uma imagem" });
    }

    const extension = path.extname(data.filename);
    if (![".png", ".jpeg", ".jpg", ".gif", ".webp"].includes(extension)) {
      return reply.status(400).send({
        error:
          "Não foi enviado uma imagem valida. Por favor envie uma imagem suportada",
      });
    }

    const imageBuffer = await data.toBuffer();
    const imageName = data.filename;

    const metadata = await sharp(imageBuffer).metadata();

    const imageLessMinimun =
      metadata.width &&
      metadata.width <= 512 &&
      metadata.height &&
      metadata.height <= 512;

    const compressedImaged = await compressImage(imageBuffer, imageName, {
      isExtracted: !imageLessMinimun,
      x: Math.floor((x / 100) * metadata.width!),
      y: Math.floor((y / 100) * metadata.height!),
      width: Math.floor((width / 100) * metadata.width!),
      height: Math.floor((height / 100) * metadata.height!),
    });

    if (!compressedImaged) {
      return reply.status(400).send({
        error: "Não foi possivel gerar a figurinha, tente outra imagem.",
      });
    }

    const compressedMetadata = await getMetadata(compressedImaged.buffer);

    if (compressedMetadata.size && compressedMetadata.size >= 200000) {
      return reply.status(400).send({
        error: "Não foi possivel gerar a figurinha, tente outra imagem.",
      });
    }

    await prisma.analytics.update({
      where: {
        kind: "analytics",
      },
      data: {
        count: { increment: 1 },
      },
    });

    let to = user.whatsapp;
    if (user.whatsapp.startsWith("+55")) {
      to = await formatBrazilianNumber(user.whatsapp);
    } else {
      to = formatPhoneForWhatsapp(to);
    }

    const fileBaseName = path.basename(data.filename, extension);
    const destination = path.resolve(
      __dirname,
      "../tmp",
      `${fileBaseName}-${randomUUID()}${compressedImaged.extension}`,
    );

    const media = new MessageMedia(
      compressedImaged.mimetype,
      compressedImaged.buffer.toString("base64"),
      compressedImaged.name,
    );
    await generateAndSendSticker(to, media, name || "", destination);

    const canExpositor = true;
    if (canExpositor) {
      await sharp(compressedImaged.buffer).toFile(destination);
    }

    return reply.status(200).send({
      message: "Figurinha enviado",
    });
  } catch (error) {
    console.log(error);
    return reply.status(200).send({ error: error });
  }
});

app.post("/login", async (request, reply) => {
  try {
    const bodySchema = z.object({
      whatsapp: z.string(),
    });

    const { whatsapp } = bodySchema.parse(request.body);

    const whatsappSanitied = whatsapp.replace("@c.us", "");

    const verifyWhatsapp = await prisma.user.findFirst({
      where: { whatsapp: whatsappSanitied },
      select: {
        id: true,
        isAuthenticated: true,
        whatsapp: true,
        token: true,
      },
    });
    const token = generateToken();

    let to = whatsappSanitied;
    if (whatsappSanitied.startsWith("+55")) {
      to = await formatBrazilianNumber(whatsappSanitied);
    } else {
      to = to;
    }

    if (verifyWhatsapp) {
      const user = await prisma.user.update({
        where: { id: verifyWhatsapp.id },
        data: {
          token,
          isAuthenticated: false,
        },
        select: {
          id: true,
          isAuthenticated: true,
          whatsapp: true,
        },
      });

      await sendMessage(
        to,
        generateMessageWithToken(message, {
          "[platform_name]": PLATFORM_NAME,
          "[token_verification]": token,
        }),
      );
      return reply.status(200).send(user);
    }

    const user = await prisma.user.create({
      data: {
        whatsapp: whatsappSanitied,
        token,
      },
      select: {
        id: true,
        isAuthenticated: true,
        whatsapp: true,
      },
    });

    await sendMessage(
      to,
      generateMessageWithToken(message, {
        "[platform_name]": PLATFORM_NAME,
        "[token_verification]": token,
      }),
    );

    return reply.status(200).send(user);
  } catch (error) {
    console.error(error);
    return reply.status(200).send({ error: error });
  }
});

app.post("/phone/validade", async (request, reply) => {
  try {
    const bodySchema = z.object({
      id: z.string(),
      token: z.string(),
    });
    const { token, id } = bodySchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });
    if (!user) {
      return reply.status(400).send({
        error: "Não foi possivel fazer a autenticação",
      });
    }

    if (user.token !== token.trim()) {
      return reply.status(401).send({
        error: "PIN incorreto. Verifique no dispositivo o pin.",
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isAuthenticated: true,
        token: null,
      },
    });

    const tokenJWT = jwt.sign(
      {
        id: user.id,
        whatsapp: user.whatsapp,
      },
      environments.secret,
      {
        expiresIn: "15d",
      },
    );

    return reply.status(200).send({
      message: "Você está autenticado. Gere seus stickers",
      data: { ...user, isAuthenticated: true },
      token: tokenJWT,
    });
  } catch (error) {
    return reply.status(200).send({ error: error });
  }
});

app.get("/session", async (request, reply) => {
  try {
    const token = request.headers["x-auth-token"] as string;
    if (!token) {
      return reply.status(401).send({ error: "Você não está autenticado." });
    }

    await jwt.verify(token, environments.secret, {}, async (err, data) => {
      if (err) {
        return reply.status(401).send({
          error: "PIN incorreto. Verifique no dispositivo o pin.",
        });
      }
      const { id } = data as { id: string };

      const user = await prisma.user.findFirst({
        where: {
          id,
        },
        select: {
          id: true,
          isAuthenticated: true,
          whatsapp: true,
        },
      });
      if (!user) {
        return reply.status(401).send({
          error: "Não foi possivel fazer a autenticação",
        });
      }

      return reply.status(200).send({
        data: user,
        message: "Você está autenticado.",
        token,
      });
    });
  } catch (error) {
    return reply.status(401).send({
      error: "Não foi possivel fazer a autenticação",
    });
  }
});

app.get("/stickers/count", async (request, reply) => {
  const analytic = await prisma.analytics.findUnique({
    where: {
      kind: "analytics",
    },
  });
  return reply.status(200).send({
    data: analytic?.count || null,
    message: "OK",
  });
});

app.get("/hc", (request, reply) => {
  return reply.status(200).send({
    message: "OK",
  });
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  console.log("Closing http server.");
  app.close(async () => {
    console.log("Http server closed.");
    await prisma.$disconnect();
    await ClientClose();
  });
  process.exit();
});

ClientInitialize().then(async () => {
  await prisma.analytics.upsert({
    where: {
      kind: "analytics",
    },
    create: {
      kind: "analytics",
    },
    update: {},
  });
  app
    .listen({
      port: environments.port,
    })
    .then(() => console.log("HTTP server running PORT: " + environments.port));
});
