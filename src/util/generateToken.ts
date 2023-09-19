export const generateToken = () => {
  const numerosAleatorios = Array.from({ length: 4 }).map(() => String(Math.floor(Math.random() * 10)))
  return numerosAleatorios.join('');
}