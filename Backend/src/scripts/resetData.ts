import { Company } from '../schemas/company.js';
import { Branch } from '../schemas/branch.js';
import { Category } from '../schemas/category.js';
import { Operator } from '../schemas/operator.js';
import { Device } from '../schemas/device.js';
import { Forklift } from '../schemas/forklift.js';
import { Telemetry } from '../schemas/telemetry.js';
import { Incident } from '../schemas/incident.js';
import { WorkSession } from '../schemas/workSession.js';
import { User } from '../schemas/user.js';
import { AccessRequest } from '../schemas/accessRequest.js';
import { seedData } from './seedData.js';

// Todas as collections da aplicação. Uma collection nova precisa entrar aqui para o reset limpá-la.
export const COLECOES = [Company, Branch, Category, Operator, Device, Forklift, Telemetry, Incident, WorkSession, User, AccessRequest];

// Apaga os documentos (os índices ficam) e roda o seed do zero.
export async function resetarBanco() {
    for (const modelo of COLECOES) await (modelo as any).deleteMany({});
    return seedData();
}
