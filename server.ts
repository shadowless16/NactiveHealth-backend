import express, { Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import prisma from './database';
import { authenticateToken, requireRole, auditLog, login, logout, getMe, AuthenticatedRequest } from './auth';
import { validate, patientSchema, encounterSchema, prescriptionSchema, loginSchema } from './validation';
import { UserRole } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(cookieParser());

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

app.post('/api/auth/login', validate(loginSchema), login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', authenticateToken, getMe);

app.post('/api/patients', 
  authenticateToken, 
  requireRole(['doctor', 'nurse', 'admin']),
  validate(patientSchema),
  auditLog('CREATE', 'patient'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { full_name, date_of_birth, gender, phone } = req.body;
      const patient = await prisma.patient.create({
        data: {
          full_name,
          date_of_birth: new Date(date_of_birth),
          gender,
          phone
        }
      });
      res.status(201).json({ id: patient.id, message: 'Patient created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.get('/api/patients',
  authenticateToken,
  requireRole(['doctor', 'nurse', 'admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search } = req.query;
      const patients = await prisma.patient.findMany({
        where: search ? {
          OR: [
            { full_name: { contains: String(search), mode: 'insensitive' } },
            { phone: { contains: String(search) } }
          ]
        } : undefined,
        orderBy: { created_at: 'desc' },
        take: 50
      });
      res.json(patients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  }
);


app.get('/api/patients/:id',
  authenticateToken,
  requireRole(['doctor', 'nurse', 'admin']),
  auditLog('READ', 'patient'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const patient = await prisma.patient.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.json(patient);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.post('/api/encounters',
  authenticateToken,
  requireRole(['doctor', 'nurse']),
  validate(encounterSchema),
  auditLog('CREATE', 'encounter'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { patient_id, clinician_role, notes } = req.body;
      
      const patient = await prisma.patient.findUnique({
        where: { id: parseInt(patient_id) }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      const encounter = await prisma.encounter.create({
        data: {
          patient_id: parseInt(patient_id),
          clinician_role,
          notes
        }
      });
      
      res.status(201).json({ id: encounter.id, message: 'Encounter created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.post('/api/prescriptions',
  authenticateToken,
  requireRole(['doctor']),
  validate(prescriptionSchema),
  auditLog('CREATE', 'prescription'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { encounter_id, drug_name, dosage, frequency, duration } = req.body;
      
      const encounter = await prisma.encounter.findUnique({
        where: { id: parseInt(encounter_id) }
      });

      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' });
      }
      
      const prescription = await prisma.prescription.create({
        data: {
          encounter_id: parseInt(encounter_id),
          drug_name,
          dosage,
          frequency,
          duration,
          created_by: req.user!.id
        }
      });
      
      res.status(201).json({ id: prescription.id, message: 'Prescription created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.get('/api/patients/:id/records',
  authenticateToken,
  requireRole(['doctor', 'nurse', 'admin']),
  auditLog('READ', 'patient_records'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const patientId = parseInt(id);

      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const encounters = await prisma.encounter.findMany({
        where: { patient_id: patientId },
        orderBy: { created_at: 'desc' },
        include: {
          prescriptions: {
            include: {
              creator: {
                select: { username: true }
              }
            },
            orderBy: { created_at: 'desc' }
          }
        }
      });

      const records = {
        patient,
        encounters: encounters.map((e: any) => {
          const { prescriptions, ...encounterData } = e;
          return encounterData;
        }),
        prescriptions: encounters.flatMap((e: any) => 
          e.prescriptions.map((p: any) => {
             return {
               ...p,
               prescribed_by: p.creator.username
             };
          })
        )
      };

      res.json(records);

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.get('/api/audit-logs',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const auditLogs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100
      });
      res.json(auditLogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Nactive Health EHR Server running on port ${PORT}`);
});
