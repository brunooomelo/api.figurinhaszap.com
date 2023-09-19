
import { fastify } from "fastify";
import { fastifyCors } from '@fastify/cors'
import { ClientInitialize, generateAndSendSticker, sendMessage } from './lib/whatsapp';
import { environments } from './lib/environment';
import fastifyMultipart from "@fastify/multipart";
import sharp from "sharp";
import path from "path";
import { prisma } from "./lib/prisma";
import { generateToken } from "./util/generateToken";
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const app = fastify()

app.register(fastifyCors, { origin: '*' })
app.register(fastifyMultipart, {
  limits: {
    fileSize: 1_048_576 * 25, // 25mb
  }
})

app.post('/stickers', async (request, reply) => {
  try {
    const data = await request.file()

    const token = request.headers['x-auth-token'] as string
    if (!token) {
      return reply.status(401).send({ error: "Você não está autenticado." })
    }

    const jwtData = await new Promise((resolve, reject) => jwt.verify(token, environments.secret, {}, async (err, data) => {
      if (err) {
        reject('Token incorreto.')
        return
      }
      resolve(data as { id: string })
    })) as { id: string }

    if (!jwtData?.id) {
      return reply.status(401).send({
        error: "Token incorreto."
      })
    }


    const user = await prisma.lead.findFirst({
      where: {
        id: jwtData.id
      }
    })

    if (!user) {
      return reply.status(401).send({
        error: "Token incorreto."
      })
    }

    if (!data) {
      return reply.status(400).send({ error: 'Missing file input.' })
    }

    const extension = path.extname(data.filename)
    if (!['.png', '.jpeg', '.jpg', '.gif', '.webp'].includes(extension)) {
      return reply.status(400).send({ error: 'Invalid input type. please upload a MP3' })
    }

    const imageBuffer = await data.toBuffer()
    const isGif = ['.webp', '.gif'].includes(extension)

    const metadata = await sharp(imageBuffer, { animated: isGif }).metadata()

    const imageShaped = sharp(imageBuffer, { animated: isGif })
    if ((metadata.width && metadata.width > 512) || (metadata.height && metadata.height > 512)) {
      imageShaped.resize(512, 512, { fit: 'cover', position: 'center' })
    }

    const fileSharped = imageShaped.webp({ quality: 90 })
    const compressed = await fileSharped.toBuffer({ resolveWithObject: true })

    if (compressed.info.size >= 200000) {
      return reply.status(400).send({
        error: 'Não foi possivel comprimir a imagem, tente outra imagem.'
      })
    }

    await generateAndSendSticker(user.wpp, compressed.data, 'sticker')

    return reply.status(200).send({
      message: 'message sent!'
    })
  } catch (error) {
    return reply.status(200).send({ error: error })
  }
})

app.post('/signup', async (request, reply) => {
  try {
    const bodySchema = z.object({
      name: z.string(),
      whatsapp: z.string(),
      email: z.string().email().optional().nullable()
    })

    const { email, name, whatsapp } = bodySchema.parse(request.body)

    const verifyWhatsapp = await prisma.lead.findFirst({
      where: { wpp: whatsapp }
    })

    if (verifyWhatsapp) {
      return reply.status(400).send({
        error: "Não foi possivel utilizar este numero."
      })
    }

    const token = generateToken()
    const user = await prisma.lead.create({
      data: {
        name,
        wpp: whatsapp,
        email: email,
        token,
      }
    })
    await sendMessage(user.wpp, `Somos a [Sticker Name] precisamos validar seu numero,\n segue o PIN para valida: ${token}`)

    return reply.status(200).send(user)
  } catch (error) {
    return reply.status(200).send({ error: error })
  }
})

app.post('/login', async (request, reply) => {
  try {
    const bodySchema = z.object({
      name: z.string(),
      whatsapp: z.string(),
      email: z.string().email().optional().nullable()
    })

    const { whatsapp } = bodySchema.parse(request.body)

    const verifyWhatsapp = await prisma.lead.findFirst({
      where: { wpp: whatsapp }
    })

    if (!verifyWhatsapp) {
      return reply.status(400).send({
        error: "Não foi possivel utilizar este numero."
      })
    }

    const token = generateToken()
    const user = await prisma.lead.update({
      where: {
        id: verifyWhatsapp.id
      },
      data: {
        token,
      }
    })
    await sendMessage(user.wpp, `Somos a [Sticker Name] precisamos validar seu numero,\n segue o PIN para validação: ${token}`)

    return reply.status(200).send(user)
  } catch (error) {
    return reply.status(200).send({ error: error })
  }
})

app.post('/phone/validade', async (request, reply) => {
  try {
    const bodySchema = z.object({
      id: z.string(),
      token: z.string(),
    })
    const { token, id } = bodySchema.parse(request.body)

    const user = await prisma.lead.findFirst({
      where: {
        id
      }
    })
    if (!user) {
      return reply.status(400).send({
        error: "Não foi possivel fazer a autenticação"
      })
    }

    if (user.token !== token.trim()) {
      return reply.status(401).send({
        error: "Token incorreto."
      })
    }

    await prisma.lead.update({
      where: { id },
      data: {
        isAuthenticate: true,
        token: null
      }
    })

    const tokenJWT = jwt.sign({
      id: user.id
    }, environments.secret, {
      expiresIn: '15d'
    });


    return reply.status(200).send({
      message: "Você está autenticado. Gere seus stickers",
      data: user,
      token: tokenJWT
    })
  } catch (error) {
    return reply.status(200).send({ error: error })
  }
})

app.get('/session', async (request, reply) => {
  try {
    const token = request.headers['x-auth-token'] as string
    if (!token) {
      return reply.status(401).send({ error: "Você não está autenticado." })
    }

    await jwt.verify(token, environments.secret, {}, async (err, data) => {
      if (err) {
        return reply.status(401).send({
          error: "Token incorreto."
        })
      }
      const { id } = data as { id: string }

      const user = await prisma.lead.findFirst({
        where: {
          id
        }
      })
      if (!user) {
        return reply.status(401).send({
          error: "Token incorreto."
        })
      }

      return reply.status(200).send({
        data: user,
        message: "Você está autenticado.",
        token
      })
    })
  } catch (error) {
    return reply.status(401).send({
      error: "Token incorreto."
    })
  }
})

app.get('/hc', (request, reply) => {
  return reply.status(200).send({
    message: "OK"
  })
})



ClientInitialize().then(() =>
  app.listen({
    port: environments.port
  })
    .then(() => console.log('HTTP server running')))
// app.listen({
//   port: environments.port
// })
// .then(() => console.log('HTTP server running'))
