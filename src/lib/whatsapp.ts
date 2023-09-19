
import sharp from 'sharp'
import qrcode from 'qrcode-terminal'
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import { environments } from './environment';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: environments.headless,
    ...(!!environments.executablePath && ( {
      executablePath: environments.executablePath
    }))
  }
});

client.on('qr', (qr) => {
  // Generate and scan this code with your phone
  qrcode.generate(qr, { small: true })
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('change_state', console.log)


client.on('message', async msg => {
  if (msg.body == '!ping') {
    msg.reply('pong');
  }

  await msg.delete()
});


export const generateAndSendSticker = async (msgFrom: string, imageBuffer: string | Buffer, stickerName: string) => {
  const fileSharp = await sharp(imageBuffer, { animated: true, })
    .resize({ height: 512, width: 512, fit: 'cover', position:'center'})
    .webp()
    .toBuffer() as unknown as string

  const media = new MessageMedia('image/webp', fileSharp , 'banner.webp')

  await client
    .sendMessage(msgFrom, 'Aguarde o sticker esta sendo gerado...')
    .catch(console.error)

  await client.sendMessage(msgFrom, media, {
    sendMediaAsSticker: true, 
    stickerAuthor: 'sticker maker',
    stickerCategories: [],
    stickerName
  })
}

export const sendMessage = async (msgFrom: string, message: string) => {
  await client.sendMessage(msgFrom, message)
}
export const ClientInitialize = () => client.initialize()