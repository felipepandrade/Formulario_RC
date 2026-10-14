
import { useState } from 'react';

// Logo oficial vetorial armazenado localmente para suporte offline e segurança de rede
const LOCAL_LOGO_URL = "/engie-logo.svg";
// Fallback caso necessário
const WIKIMEDIA_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/9/9b/Engie_logo.svg";

const LOGO_STYLE: React.CSSProperties = { objectFit: 'contain' };

export const EngieLogo = ({ className = "h-24 w-auto" }: { className?: string }) => {
  const [imgSrc, setImgSrc] = useState(LOCAL_LOGO_URL);

  return (
    <img
      src={imgSrc}
      alt="ENGIE"
      className={className}
      style={LOGO_STYLE}
      onError={() => {
        // Se der erro no link do GitHub, muda automaticamente para o da Wikimedia
        if (imgSrc !== WIKIMEDIA_LOGO_URL) {
          setImgSrc(WIKIMEDIA_LOGO_URL);
        }
      }}
    />
  );
};
