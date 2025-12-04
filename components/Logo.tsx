
import React from 'react';

export const EngieLogo = ({ className = "h-24 w-auto" }: { className?: string }) => (
  <img
    // Usando o link raw do GitHub para garantir que a imagem seja carregada corretamente
    src="https://raw.githubusercontent.com/felipepandrade/Formulario_RC/main/Logo-Principal-Azul-Fundo-Transparente.png"
    alt="ENGIE"
    className={className}
    style={{ objectFit: 'contain' }}
  />
);
