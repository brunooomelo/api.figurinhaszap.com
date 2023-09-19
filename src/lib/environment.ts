import dotenv from 'dotenv'
dotenv.config()
import { z } from "zod"

const schema = z.object({
  origin: z.string().nullable().transform((value) => value?.split(',')),
  executablePath: z.string().nullable(),
  headless: z.coerce.boolean().default(false),
  port: z.coerce.number().nullable(),
  secret: z.string()
})

const processEnv = schema.parse(process.env)

export const environments = {
  origin: process.env.NODE_ENV === 'development'? ['*']: processEnv.origin,
  executablePath: processEnv.executablePath,
  headless: processEnv.headless,
  port: processEnv.port || 3333,
  secret: processEnv.secret
}
