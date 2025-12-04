import express, { Request, Response } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// --- Types (Duplicated from frontend just for standalone server execution safety) ---
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
}

interface RequisitionPayload {
  requester: string;
  location: string;
  justification: string;
  buyerObservation: string;
  providerObservation: string;
  items: RequisitionItem[];
}

// --- Configuration ---
const PORT = 3000;
const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary folder for uploads

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
// NOTE: For development, use Ethereal or specific SMTP settings.
// This example assumes a generic SMTP service. You must configure environment variables.
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
const generateHtmlBody = (data: RequisitionPayload) => {
  let itemsHtml = '';
  
  data.items.forEach((item, index) => {
    itemsHtml += `
      <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9;">
        <h3 style="margin-top: 0;">Item #${index + 1}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px; font-weight: bold;">Código:</td>
            <td>${item.itemCode || 'A DEFINIR'}</td>
            <td style="padding: 5px; font-weight: bold;">Quantidade:</td>
            <td>${item.quantity}</td>
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
      </div>
    `;
  });

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Solicitação de Requisição de Compra</h2>
        <p><strong>Solicitante:</strong> ${data.requester}</p>
        <p><strong>Base/Local:</strong> ${data.location}</p>
        <hr />
        
        <h3>Itens Solicitados</h3>
        ${itemsHtml}
        
        <hr />
        <h3>Detalhes Gerais</h3>
        <p><strong>Justificativa:</strong><br/>${data.justification}</p>
        
        <div style="background-color: #eef; padding: 10px; margin-top: 10px;">
          <p><strong>Observação ao Comprador:</strong><br/>${data.buyerObservation || 'N/A'}</p>
        </div>
        
        <div style="background-color: #fee; padding: 10px; margin-top: 10px;">
          <p><strong>Observação ao Fornecedor:</strong><br/>${data.providerObservation || 'N/A'}</p>
        </div>
        
        <p style="font-size: 12px; color: #888; margin-top: 30px;">
          Email gerado automaticamente pelo Sistema ESOM.
        </p>
      </body>
    </html>
  `;
};

// --- Route: Submit ---
app.post('/api/submit', upload.array('files'), async (req: Request, res: Response) => {
  try {
    // 1. Parse Data
    const rawData = req.body.data;
    if (!rawData) {
        res.status(400).json({ message: 'Dados do formulário ausentes.' });
        return;
    }

    const data: RequisitionPayload = JSON.parse(rawData);

    // 2. Validate essential logic (Backend Double Check)
    if (!data.items || data.items.length === 0) {
        res.status(400).json({ message: 'Nenhum item na requisição.' });
        return;
    }

    // 3. Determine Recipient
    const recipientEmail = EMAIL_MAPPING[data.location];
    if (!recipientEmail) {
        res.status(400).json({ message: 'Local de entrega inválido ou sem email configurado.' });
        return;
    }

    // 4. Prepare Attachments
    const files = req.files as any[];
    const attachments = files?.map(file => ({
      filename: file.originalname,
      path: file.path
    })) || [];

    // 5. Send Email
    const mailOptions = {
      from: '"Sistema ESOM" <no-reply@esom-system.com>',
      to: recipientEmail,
      subject: `Solicitação de Requisição de Compra – ${data.requester} – ${data.location}`,
      html: generateHtmlBody(data),
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);

    // 6. Cleanup uploaded files
    attachments.forEach(att => {
      fs.unlink(att.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });

    res.status(200).json({ message: 'Requisição enviada com sucesso!', messageId: info.messageId });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`ESOM Server running on http://localhost:${PORT}`);
});