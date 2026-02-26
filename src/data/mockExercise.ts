import { MediaType, MediaStatus } from '../types/media';
import type { Media } from '../types/media';

const MOCK_MEDIA_1: Media = {
  url: 'https://cdn.nexur.com.br/users/70788/1765308967055-246b9da3-ea29-4fb7-93ca-7d837d654170_720.mp4',
  type: MediaType.VIDEO,
  asGif: false,
  status: MediaStatus.SUCCESS,
  rev: 2,
};

const MOCK_MEDIA_2: Media = {
  url: 'https://cdn.nexur.com.br/users/70788/1772113209482-IMG_6212.PNG',
  type: MediaType.IMAGE,
  asGif: false,
  status: MediaStatus.SUCCESS,
};

// Base mock — matches real ParsedExercise shape
export const MOCK_EXERCISE = {
  active: true,
  createdAt: '2025-12-09 19:35:55Z',
  deletedAt: null,
  description_br: 'Barra, Ombro',
  description_en: 'Barbell, Shoulders',
  description_es: '',
  equipmentType: '1',
  equipmentTypeText: 'Barra',
  exerciseCategory: '8',
  exerciseCategoryText: 'Ombro',
  exerciseType: '1',
  exerciseTypeText: 'Ombro',
  id: '0dcef288-b71b-4230-986f-6f268e1bb817',
  id_primary: '329780',
  media1: MOCK_MEDIA_1,
  media2: MOCK_MEDIA_2,
  notes: '',
  system: 0,
  title: 'Clean & Press com Barra',
  title_en: 'Clean & Press com Barra',
  title_es: 'Clean & Press com Barra',
  updateId: '5393554',
  updatedAt: '2025-12-09 20:08:03Z',
  userId: '70788',
};

// 12 library entries — same media, varied names/categories
export const MOCK_LIBRARY_EXERCISES = [
  { id: '1',  name: 'Clean & Press com Barra',  category: 'Ombro',     equipment: 'Barra',    media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '2',  name: 'Desenvolvimento com Barra', category: 'Ombro',     equipment: 'Barra',    media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '3',  name: 'Elevação Lateral',          category: 'Ombro',     equipment: 'Haltere',  media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '4',  name: 'Supino Reto',               category: 'Peito',     equipment: 'Barra',    media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '5',  name: 'Agachamento Livre',         category: 'Pernas',    equipment: 'Barra',    media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '6',  name: 'Rosca Direta',              category: 'Bíceps',    equipment: 'Haltere',  media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '7',  name: 'Prancha Abdominal',         category: 'Core',      equipment: 'Chão',     media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '8',  name: 'Levantamento Terra',        category: 'Posterior', equipment: 'Barra',    media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '9',  name: 'Tríceps Corda',             category: 'Tríceps',   equipment: 'Cabo',     media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '10', name: 'Stiff',                     category: 'Posterior', equipment: 'Barra',    media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '11', name: 'Farmer Walk',               category: 'Funcional', equipment: 'Haltere',  media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
  { id: '12', name: 'Agachamento Búlgaro',       category: 'Pernas',    equipment: 'Haltere',  media1: MOCK_MEDIA_1, media2: MOCK_MEDIA_2 },
];
