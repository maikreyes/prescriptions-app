import PDFDocument from 'pdfkit';
import { PassThrough } from 'node:stream';

type PrescriptionPdfData = {
  code: string;
  status: string;
  createdAt: Date;
  consumedAt: Date | null;
  notes: string | null;
  doctorName: string;
  doctorEmail: string;
  patientName: string;
  patientEmail: string;
  items: Array<{
    name: string;
    dosage: string | null;
    quantity: number | null;
    instructions: string | null;
  }>;
};

const formatDate = (value: Date | null) =>
  value
    ? new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(value)
    : 'N/A';

export const buildPrescriptionPdfBuffer = async (
  data: PrescriptionPdfData,
): Promise<Buffer> => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  const pdfBuffer = new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

  doc.pipe(stream);

  doc.fontSize(20).text('Prescription', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Code: ${data.code}`);
  doc.text(`Status: ${data.status}`);
  doc.text(`Created at: ${formatDate(data.createdAt)}`);
  doc.text(`Consumed at: ${formatDate(data.consumedAt)}`);
  doc.moveDown();

  doc.fontSize(14).text('Doctor');
  doc.fontSize(12).text(`${data.doctorName} <${data.doctorEmail}>`);
  doc.moveDown();

  doc.fontSize(14).text('Patient');
  doc.fontSize(12).text(`${data.patientName} <${data.patientEmail}>`);
  doc.moveDown();

  if (data.notes) {
    doc.fontSize(14).text('Notes');
    doc.fontSize(12).text(data.notes);
    doc.moveDown();
  }

  doc.fontSize(14).text('Items');
  data.items.forEach((item, index) => {
    doc.fontSize(12).text(`${index + 1}. ${item.name}`);
    doc.text(`Dosage: ${item.dosage ?? 'N/A'}`);
    doc.text(`Quantity: ${item.quantity ?? 'N/A'}`);
    doc.text(`Instructions: ${item.instructions ?? 'N/A'}`);
    doc.moveDown(0.5);
  });

  doc.end();

  return pdfBuffer;
};
