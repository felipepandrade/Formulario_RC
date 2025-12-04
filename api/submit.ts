
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// --- Types (Shared) ---
interface RequisitionItem {
  itemCode: string;
  description: string;
  quantity: number;
  price: number;
  originType: string;
  agreementType: string;
  agreement?: string;
  provider?: string;
  osNumber?: string;
  destinationType: string;
  subInventory?: string;
  usageIntent: string;
  objective: string;
  justification: string;
  buyerObservation: string;
  providerObservation: string;
}

interface RequisitionPayload {
  requester: string;
  location: string;
  items: RequisitionItem[];
}

// --- Email Mapping ---
const EMAIL_MAPPING: Record<string, string> = {
  'ESOM_F_CATU_OI': 'tatiana.ribeiro@engie.com',
  'ESOM_F_CAMACARI_OI': 'luciana.buente@engie.com',
  'ESOM_F_ITABUNA_OI': 'alane.reis@engie.com',
  'ESOM_F_PILAR_OI': 'camila.monteiro@engie.com',
  'ESOM_F_ATALAIA_OI': 'ivone.andrade@engie.com',
};

// --- Mail Transporter (Stream) ---
// We use streamTransport to generate the email raw source (RFC822) 
// instead of sending it via SMTP.
const transporter = nodemailer.createTransport({
  streamTransport: true,
  newline: 'windows', // Important for Outlook
  buffer: true
});

// --- HTML Generator ---
const generateHtmlBody = (data: RequisitionPayload) => {
  let itemsHtml = '';
  
  data.items.forEach((item, index) => {
    itemsHtml += `
      <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9;">
        <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Item #${index + 1}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px; font-weight: bold; width: 15%;">Código:</td>
            <td style="width: 35%;">${item.itemCode || 'A DEFINIR'}</td>
            <td style="padding: 5px; font-weight: bold; width: 15%;">Quantidade:</td>
            <td style="width: 35%;">${item.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">Descrição:</td>
            <td colspan="3">${item.description}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">Preço Est.:</td>
            <td>R$ ${item.price}</td>
            <td style="padding: 5px; font-weight: bold;">OS:</td>
            <td>${item.osNumber || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">Origem:</td>
            <td>${item.originType}</td>
            <td style="padding: 5px; font-weight: bold;">Acordo:</td>
            <td>${item.agreementType} ${item.agreement ? `(${item.agreement})` : ''}</td>
          </tr>
          <tr>
             <td style="padding: 5px; font-weight: bold;">Destino:</td>
             <td>${item.destinationType}</td>
             <td style="padding: 5px; font-weight: bold;">Subinventário:</td>
             <td>${item.subInventory || '-'}</td>
          </tr>
           <tr>
             <td style="padding: 5px; font-weight: bold;">Objetivo:</td>
             <td>${item.objective}</td>
             <td style="padding: 5px; font-weight: bold;">Uso:</td>
             <td>${item.usageIntent}</td>
          </tr>
        </table>

        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;">
            <p style="margin: 5px 0;"><strong>Justificativa:</strong><br/>${item.justification}</p>
            <div style="background-color: #eef; padding: 5px; margin-top: 5px; font-size: 13px;">
                <strong>Obs. Comprador:</strong> ${item.buyerObservation || '-'}
            </div>
            <div style="background-color: #fee; padding: 5px; margin-top: 5px; font-size: 13px;">
                <strong>Obs. Fornecedor:</strong> ${item.providerObservation || '-'}
            </div>
        </div>
      </div>
    `;
  });

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0056b3;">Solicitação de Requisição de Compra</h2>
        <p><strong>Solicitante:</strong> ${data.requester}</p>
        <p><strong>Base/Local:</strong> ${data.location}</p>
        <hr />
        
        <h3>Itens Solicitados</h3>
        ${itemsHtml}
        
        <p style="font-size: 12px; color: #888; margin-top: 30px;">
          Email gerado automaticamente pelo Sistema ESOM.
        </p>
      </body>
    </html>
  `;
};

// --- Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const data: RequisitionPayload = req.body;
    
    if (!data) {
      res.status(400).json({ message: 'Dados do formulário ausentes.' });
      return;
    }

    if (!data.items || data.items.length === 0) {
      res.status(400).json({ message: 'Nenhum item na requisição.' });
      return;
    }

    const recipientEmail = EMAIL_MAPPING[data.location];
    if (!recipientEmail) {
      res.status(400).json({ message: 'Local de entrega inválido ou sem email configurado.' });
      return;
    }

    // Prepare Email Options
    const mailOptions = {
      from: '"Sistema ESOM" <no-reply@esom-system.com>',
      to: recipientEmail,
      subject: `Solicitação de Requisição de Compra – ${data.requester} – ${data.location}`,
      html: generateHtmlBody(data),
    };

    // Generate EML (Stream)
    const info: any = await transporter.sendMail(mailOptions);
    
    // Set headers for file download
    const filename = `Requisicao_${data.requester.replace(/\s+/g, '_')}.eml`;
    res.setHeader('Content-Type', 'message/rfc822');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the buffer/stream
    res.status(200).send(info.message);

  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erro interno no servidor.', details: error.message });
  }
}
