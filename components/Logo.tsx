
import { useState } from 'react';

// Tenta carregar do seu repositório primeiro
const GITHUB_LOGO_URL = "https://raw.githubusercontent.com/felipepandrade/Formulario_RC/main/Logo-Principal-Azul-Fundo-Transparente.png";
// Fallback oficial se a imagem do repo não existir ou der erro
const WIKIMEDIA_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/9/9b/Engie_logo.svg";

export const EngieLogo = ({ className = "h-24 w-auto" }: { className?: string }) => {
  const [imgSrc, setImgSrc] = useState(GITHUB_LOGO_URL);

  return (
    <img
      src={imgSrc}
      alt="ENGIE"
      className={className}
      style={{ objectFit: 'contain' }}
      onError={() => {
        // Se der erro no link do GitHub, muda automaticamente para o da Wikimedia
        if (imgSrc !== WIKIMEDIA_LOGO_URL) {
          setImgSrc(WIKIMEDIA_LOGO_URL);
        }
      }}
    />
  );
};
