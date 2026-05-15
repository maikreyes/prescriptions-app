import { NotFoundException, Injectable, StreamableFile } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { PrescriptionStatus, Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';
import { DoctorPrescriptionsQueryDto } from './dto/doctor-prescriptions-query.dto.js';
import { AdminPrescriptionsQueryDto } from './dto/admin-prescriptions-query.dto.js';
import { PatientPrescriptionsQueryDto } from './dto/patient-prescriptions-query.dto.js';
import { buildPrescriptionPdfBuffer } from './prescriptions.pdf.js';

const prescriptionSelect = {
  id: true,
  code: true,
  status: true,
  notes: true,
  createdAt: true,
  consumedAt: true,
  patient: {
    select: {
      id: true,
      birdDate: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  },
  author: {
    select: {
      id: true,
      speciality: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  },
  items: {
    select: {
      id: true,
      name: true,
      dosage: true,
      quantity: true,
      instructions: true,
    },
  },
} satisfies Prisma.PrescriptionSelect;

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildCreatedAtFilter(from?: string, to?: string) {
    const createdAt: Prisma.DateTimeFilter = {};

    if (from) {
      createdAt.gte = new Date(from);
    }

    if (to) {
      createdAt.lte = new Date(to);
    }

    return Object.keys(createdAt).length > 0 ? createdAt : undefined;
  }

  private async getDoctorByUserId(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctor;
  }

  private async getPatientByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  private buildPrescriptionWhere(params: {
    status?: PrescriptionStatus;
    from?: string;
    to?: string;
    authorId?: string;
    patientId?: string;
  }) {
    const where: Prisma.PrescriptionWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.authorId ? { authorId: params.authorId } : {}),
      ...(params.patientId ? { patientId: params.patientId } : {}),
    };

    const createdAt = this.buildCreatedAtFilter(params.from, params.to);

    if (createdAt) {
      where.createdAt = createdAt;
    }

    return where;
  }

  private async paginate(
    where: Prisma.PrescriptionWhereInput,
    page: number,
    limit: number,
    order: 'asc' | 'desc',
  ) {
    const skip = (page - 1) * limit;

    const [total, prescriptions] = await this.prisma.$transaction([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: order },
        select: prescriptionSelect,
      }),
    ]);

    return {
      data: prescriptions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async create(userId: string, createPrescriptionDto: CreatePrescriptionDto) {
    const doctor = await this.getDoctorByUserId(userId);
    const patient = await this.prisma.patient.findUnique({
      where: { id: createPrescriptionDto.patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const createdPrescription = await this.prisma.prescription.create({
      data: {
        code: `RX-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
        notes: createPrescriptionDto.notes?.trim() || null,
        patientId: patient.id,
        authorId: doctor.id,
        items: {
          create: createPrescriptionDto.items.map((item) => ({
            name: item.name.trim(),
            dosage: item.dosage?.trim() || null,
            quantity: item.quantity,
            instructions: item.instructions?.trim() || null,
          })),
        },
      },
      select: prescriptionSelect,
    });

    return createdPrescription;
  }

  async findDoctorPrescriptions(
    userId: string,
    query: DoctorPrescriptionsQueryDto,
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    const authorId = query.mine ? doctor.id : undefined;

    const where = this.buildPrescriptionWhere({
      status: query.status,
      from: query.from,
      to: query.to,
      authorId,
    });

    return this.paginate(where, query.page, query.limit, query.order);
  }

  async findPatientPrescriptions(
    userId: string,
    query: PatientPrescriptionsQueryDto,
  ) {
    const patient = await this.getPatientByUserId(userId);

    const where = this.buildPrescriptionWhere({
      status: query.status,
      patientId: patient.id,
    });

    return this.paginate(where, query.page, query.limit, 'desc');
  }

  async findAdminPrescriptions(
    userId: string,
    query: AdminPrescriptionsQueryDto,
  ) {
    await this.prisma.user.findUniqueOrThrow({
      where: { id: userId, role: Role.admin },
      select: { id: true },
    });

    const where = this.buildPrescriptionWhere({
      status: query.status,
      from: query.from,
      to: query.to,
      authorId: query.doctorId,
      patientId: query.patientId,
    });

    return this.paginate(where, query.page, query.limit, 'desc');
  }

  async consumePrescription(userId: string, prescriptionId: string) {
    const patient = await this.getPatientByUserId(userId);

    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        patientId: patient.id,
      },
      select: prescriptionSelect,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const consumedPrescription = await this.prisma.prescription.update({
      where: { id: prescription.id },
      data: {
        status: PrescriptionStatus.consumed,
        consumedAt: prescription.consumedAt ?? new Date(),
      },
      select: prescriptionSelect,
    });

    return consumedPrescription;
  }

  async getPrescriptionById(userId: string, prescriptionId: string) {
    let prescription: any = null;

    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (patient) {
      prescription = await this.prisma.prescription.findFirst({
        where: {
          id: prescriptionId,
          patientId: patient.id,
        },
        select: prescriptionSelect,
      });
    }

    if (!prescription) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (doctor) {
        prescription = await this.prisma.prescription.findFirst({
          where: {
            id: prescriptionId,
            authorId: doctor.id,
          },
          select: prescriptionSelect,
        });
      }
    }

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async getPrescriptionPdf(userId: string, prescriptionId: string) {
    const patient = await this.getPatientByUserId(userId);

    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        patientId: patient.id,
      },
      select: prescriptionSelect,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const pdfBuffer = await buildPrescriptionPdfBuffer({
      code: prescription.code,
      status: prescription.status,
      createdAt: prescription.createdAt,
      consumedAt: prescription.consumedAt,
      notes: prescription.notes,
      doctorName: prescription.author.user.name,
      doctorEmail: prescription.author.user.email,
      patientName: prescription.patient.user.name,
      patientEmail: prescription.patient.user.email,
      items: prescription.items.map((item) => ({
        name: item.name,
        dosage: item.dosage,
        quantity: item.quantity,
        instructions: item.instructions,
      })),
    });

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="prescription-${prescription.code}.pdf"`,
    });
  }
}
