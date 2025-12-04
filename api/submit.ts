// Este arquivo não é mais necessário.
// A aplicação agora roda totalmente no cliente (navegador) e usa mailto: para abrir o Outlook.
export default function handler(req: any, res: any) {
  res.status(200).send("API descontinuada. Use o cliente de email.");
}
