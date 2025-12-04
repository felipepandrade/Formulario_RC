import express, { Request, Response } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cors from 'cors';
import { Buffer } from 'buffer';

// --- Types ---
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

// Define MulterFile interface to avoid missing Express namespace issues
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// --- Configuration ---
const PORT = 3000;
const app = express();
// Use Memory Storage for consistency with Vercel function
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- Email Mapping ---
const EMAIL_MAPPING: Record<string, string> = {
  'ESOM_F_CATU_OI': 'tatiana.ribeiro@engie.com',
  'ESOM_F_CAMACARI_OI': 'luciana.buente@engie.com',
  'ESOM_F_ITABUNA_OI': 'alane.reis@engie.com',
  'ESOM_F_PILAR_OI': 'camila.monteiro@engie.com',
  'ESOM_F_ATALAIA_OI': 'ivone.andrade@engie.com',
};

// --- Mail Transporter Setup ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass',
  },
});

// --- Helper: Generate HTML Table ---
const generateHtmlBody = (data: RequisitionPayload, filesInfo: {fieldname: string, originalname: string}[]) => {
  let itemsHtml = '';
  
  data.items.forEach((item, index) => {
    const itemFiles = filesInfo.filter(f => f.fieldname === `files_${index}`);
    const fileListHtml = itemFiles.length > 0 
        ? `<div style="margin-top:5px; font-size: 12px; color: #555;"><strong>Anexos:</strong> ${itemFiles.map(f => f.originalname).join(', ')}</div>`
        : '';

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
             ${fileListHtml}
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

// --- Route: Submit ---
app.post('/api/submit', upload.any(), async (req: Request, res: Response) => {
  try {
    const rawData = req.body.data;
    if (!rawData) {
        res.status(400).json({ message: 'Dados do formulário ausentes.' });
        return;
    }

    const data: RequisitionPayload = JSON.parse(rawData);

    if (!data.items || data.items.length === 0) {
        res.status(400).json({ message: 'Nenhum item na requisição.' });
        return;
    }

    const recipientEmail = EMAIL_MAPPING[data.location];
    if (!recipientEmail) {
        res.status(400).json({ message: 'Local de entrega inválido ou sem email configurado.' });
        return;
    }

    const files = req.files as unknown as MulterFile[];
    const attachments = files?.map(file => ({
      filename: file.originalname,
      content: file.buffer // Use Buffer
    })) || [];

    const mailOptions = {
      from: '"Sistema ESOM" <no-reply@esom-system.com>',
      to: recipientEmail,
      subject: `Solicitação de Requisição de Compra – ${data.requester} – ${data.location}`,
      html: generateHtmlBody(data, files || []),
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);

    res.status(200).json({ message: 'Requisição enviada com sucesso!', messageId: info.messageId });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`ESOM Server running on http://localhost:${PORT}`);
});