type KeyMessage = "[platform_name]" | "[token_verification]";
export const message = `Seja bem-vindo(a) à nossa plataforma de criação de stickers, *[platform_name]*! Para sua segurança, enviamos um Token de Verificação exclusivo:

_*[token_verification]*_
  
_Saiba que sua privacidade é nossa maior preocupação. Seu número não será salvo e usaremos o token apenas para confirmar sua identidade. Após a verificação, você estará pronto(a) para explorar todas as nossas ferramentas criativas_.
  
Não hesite em nos contatar se precisar de ajuda ou tiver alguma dúvida. Estamos aqui para tornar sua experiência incrível!
  
Gratidão por escolher a gente. Estamos ansiosos para ver suas criações!
  
Atenciosamente,
*[platform_name]*`;

export const generateMessageWithToken = (
  text: string,
  config: Record<KeyMessage, string>
) => {
  text = text.replace(/\[token_verification\]/g, config['[token_verification]'])
  text = text.replace(/\[platform_name\]/g, config['[platform_name]'])
  return text;
};
