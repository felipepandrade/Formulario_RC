
import React, { useState } from 'react';

export const EngieLogo = ({ className = "h-24 w-auto" }: { className?: string }) => {
  // Tenta carregar do seu repositório primeiro
  const githubUrl = "https://raw.githubusercontent.com/felipepandrade/Formulario_RC/main/Logo-Principal-Azul-Fundo-Transparente.png";
  // Fallback oficial se a imagem do repo não existir ou der erro
  const wikimediaUrl = "https://upload.wikimedia.org/wikipedia/commons/9/9b/Engie_logo.svg";

  const [imgSrc, setImgSrc] = useState(githubUrl);

  return (
    <img
      src={imgSrc}
      alt="ENGIE"
      className={className}
      style={{ objectFit: 'contain' }}
      onError={() => {
        // Se der erro no link do GitHub, muda automaticamente para o da Wikimedia
        if (imgSrc !== wikimediaUrl) {
          setImgSrc(wikimediaUrl);
        }
      }}
    />
  );
};
