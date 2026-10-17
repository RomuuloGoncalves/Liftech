import type { Employee } from '../../data/team'

/** Builds an employee as GET /operators returns it. */
export const employee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'x',
  matricula: 'EMP-001',
  nome: 'Fulano',
  telefone: '',
  cargo: 'Ajudante',
  horarioEntrada: '',
  horarioSaida: '',
  filialId: 'f1',
  usuario: 'fulano',
  acesso: 'Permitido',
  ...overrides,
})

const row = (id: string, matricula: string, nome: string, telefone: string, cargo: string, horarioEntrada: string, horarioSaida: string, usuario: string | null, acesso: Employee['acesso']) =>
  employee({ id, matricula, nome, telefone, cargo, horarioEntrada, horarioSaida, usuario, acesso })

/** Stand-in for the API list: 5 allowed, 5 denied with login, 1 without login. */
export const EMPLOYEES: Employee[] = [
  row('1', 'EMP-084', 'Alexandre Mattos', '(55) 15 999999999', 'Ajudante', '08:00', '17:00', 'AlexandreMattos', 'Permitido'),
  row('2', 'EMP-085', 'Carlos Silva', '(55) 15 988887777', 'Operador', '07:00', '16:00', 'CarlosSilva', 'Permitido'),
  row('3', 'EMP-086', 'Ana Souza', '(55) 15 977776666', 'Supervisora', '08:00', '17:00', 'AnaSouza', 'Permitido'),
  row('4', 'EMP-087', 'João Pereira', '(55) 15 966665555', 'Operador', '14:00', '22:00', 'JoaoPereira', 'Permitido'),
  row('5', 'EMP-088', 'Marina Costa', '(55) 15 955554444', 'Ajudante', '08:00', '17:00', 'MarinaCosta', 'Permitido'),
  row('6', 'EMP-089', 'Rafael Lima', '(55) 15 944443333', 'Operador', '22:00', '06:00', 'RafaelLima', 'Negado'),
  row('7', 'EMP-090', 'Beatriz Alves', '(55) 15 933332222', 'Ajudante', '08:00', '17:00', 'BeatrizAlves', 'Negado'),
  row('8', 'EMP-091', 'Fernanda Dias', '(55) 15 922221111', 'Conferente', '09:00', '18:00', 'FernandaDias', 'Negado'),
  row('9', 'EMP-092', 'Paulo Nunes', '(55) 15 911110000', 'Operador', '07:00', '16:00', 'PauloNunes', 'Negado'),
  row('10', 'EMP-093', 'Larissa Rocha', '(55) 15 900009999', 'Ajudante', '08:00', '17:00', 'LarissaRocha', 'Negado'),
  row('11', 'EMP-094', 'Diego Martins', '(55) 15 988880000', 'Conferente', '14:00', '22:00', null, 'Negado'),
]
