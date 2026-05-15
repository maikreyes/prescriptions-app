import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrescriptionStatus, Role } from '../generated/prisma/enums.js';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString),
});

type SeedUser = {
  email: string;
  name: string;
  password: string;
  role: typeof Role.admin | typeof Role.doctor | typeof Role.patient;
  speciality?: string;
  birdDate?: Date;
};

type SeedPrescriptionItem = {
  name: string;
  dosage?: string;
  quantity?: number;
  instructions?: string;
};

type SeedPrescription = {
  code: string;
  status:
    | typeof PrescriptionStatus.pending
    | typeof PrescriptionStatus.consumed;
  notes?: string;
  consumedAt?: Date;
  items: SeedPrescriptionItem[];
};

const usersToSeed: SeedUser[] = [
  {
    email: 'admin@test.com',
    name: 'Admin User',
    password: 'admin123',
    role: Role.admin,
  },
  {
    email: 'dr@test.com',
    name: 'Doctor User',
    password: 'dr123',
    role: Role.doctor,
    speciality: 'General Medicine',
  },
  {
    email: 'patient@test.com',
    name: 'Patient User',
    password: 'patient123',
    role: Role.patient,
    birdDate: new Date('1994-08-21'),
  },
];

const prescriptionTemplates: SeedPrescription[] = [
  {
    code: 'RX-0001',
    status: PrescriptionStatus.pending,
    notes: 'Control de presión arterial',
    items: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        quantity: 30,
        instructions: 'Tomar una vez al día en la mañana',
      },
    ],
  },
  {
    code: 'RX-0002',
    status: PrescriptionStatus.consumed,
    notes: 'Tratamiento completado',
    consumedAt: new Date('2026-04-10T10:00:00.000Z'),
    items: [
      {
        name: 'Amoxicilina',
        dosage: '500mg',
        quantity: 21,
        instructions: 'Tomar cada 8 horas por 7 días',
      },
    ],
  },
  {
    code: 'RX-0003',
    status: PrescriptionStatus.pending,
    notes: 'Dolor muscular',
    items: [
      {
        name: 'Ibuprofeno',
        dosage: '400mg',
        quantity: 20,
        instructions: 'Tomar después de comer',
      },
    ],
  },
  {
    code: 'RX-0004',
    status: PrescriptionStatus.consumed,
    notes: 'Antibiótico terminado',
    consumedAt: new Date('2026-04-15T16:30:00.000Z'),
    items: [
      {
        name: 'Azitromicina',
        dosage: '500mg',
        quantity: 3,
        instructions: 'Tomar 1 tableta diaria por 3 días',
      },
    ],
  },
  {
    code: 'RX-0005',
    status: PrescriptionStatus.pending,
    notes: 'Alergia estacional',
    items: [
      {
        name: 'Loratadina',
        dosage: '10mg',
        quantity: 15,
        instructions: 'Tomar una vez al día',
      },
    ],
  },
  {
    code: 'RX-0006',
    status: PrescriptionStatus.consumed,
    notes: 'Control de glucosa',
    consumedAt: new Date('2026-04-20T09:15:00.000Z'),
    items: [
      {
        name: 'Metformina',
        dosage: '850mg',
        quantity: 60,
        instructions: 'Tomar dos veces al día con alimentos',
      },
    ],
  },
  {
    code: 'RX-0007',
    status: PrescriptionStatus.pending,
    notes: 'Dolor de cabeza recurrente',
    items: [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        quantity: 24,
        instructions: 'Tomar cada 6 horas si es necesario',
      },
    ],
  },
  {
    code: 'RX-0008',
    status: PrescriptionStatus.consumed,
    notes: 'Gastritis tratada',
    consumedAt: new Date('2026-04-25T11:45:00.000Z'),
    items: [
      {
        name: 'Omeprazol',
        dosage: '20mg',
        quantity: 14,
        instructions: 'Tomar 30 minutos antes del desayuno',
      },
    ],
  },
];

async function main() {
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const hashedPasswords = await Promise.all(
    usersToSeed.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    })),
  );

  const admin = await prisma.user.create({
    data: {
      email: hashedPasswords[0].email,
      name: hashedPasswords[0].name,
      password: hashedPasswords[0].password,
      role: hashedPasswords[0].role,
    },
    select: { id: true },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: hashedPasswords[1].email,
      name: hashedPasswords[1].name,
      password: hashedPasswords[1].password,
      role: hashedPasswords[1].role,
    },
    select: { id: true },
  });

  const patientUser = await prisma.user.create({
    data: {
      email: hashedPasswords[2].email,
      name: hashedPasswords[2].name,
      password: hashedPasswords[2].password,
      role: hashedPasswords[2].role,
    },
    select: { id: true },
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      speciality: usersToSeed[1].speciality,
    },
    select: { id: true },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      birdDate: usersToSeed[2].birdDate,
    },
    select: { id: true },
  });

  await prisma.$transaction(
    prescriptionTemplates.map((prescription) =>
      prisma.prescription.create({
        data: {
          code: prescription.code,
          status: prescription.status,
          notes: prescription.notes,
          patientId: patient.id,
          authorId: doctor.id,
          ...(prescription.consumedAt
            ? { consumedAt: prescription.consumedAt }
            : {}),
          items: {
            create: prescription.items.map((item) => ({
              name: item.name,
              dosage: item.dosage,
              quantity: item.quantity,
              instructions: item.instructions,
            })),
          },
        },
        select: {
          id: true,
          code: true,
          status: true,
        },
      }),
    ),
  );

  console.log('Seed completed successfully');
  console.log(
    `Created users: admin=${admin.id}, doctor=${doctor.id}, patient=${patient.id}`,
  );
  console.log(`Created prescriptions: ${prescriptionTemplates.length}`);
}

main()
  .catch((error) => {
    console.error('Seed failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
