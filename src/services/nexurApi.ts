import type { Media } from '../types/media';
import { MediaType, MediaStatus } from '../types/media';
import type { LibraryExercise } from '../App';

const API_BASE = 'https://api.nexurapp.com';
const BEARER_TOKEN = 'cdd8d02bd6d0a08464OJ0jJ3UTmbG10S6yXbCxnhoE2Uav2';

// --- Raw API types ---
interface NexurMediaRaw {
  url: string;
  thumbnail?: string;
  type: string;
  status: string;
  asGif?: boolean;
  rev?: number;
}

interface NexurExercicio {
  id_exercicio: number;
  descricao_pt: string;
  descricao_en: string;
  descricao_es: string;
  media1: string | null;
  media2: string | null;
  tipoEquipamento: { descricao_pt: string; descricao_en: string } | null;
  classificacaoExercicio: {
    descricao_pt: string;
    descricao_en: string;
    tipoExercicio?: { descricao_pt: string; descricao_en: string };
  } | null;
  orientacoes: string
}

interface NexurExercicioItem {
  id_exercicio_usuario: number;
  id_exercicio: number;
  ativo: number;
  exercicio: NexurExercicio;
}

// --- Parsers ---
function parseMedia(raw: string | null): Media | null {
  if (!raw) return null;
  try {
    const obj: NexurMediaRaw = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      url: obj.url,
      thumbnail: obj.thumbnail,
      type: (obj.type as MediaType) ?? MediaType.IMAGE,
      asGif: obj.asGif ?? false,
      status: (obj.status as MediaStatus) ?? MediaStatus.SUCCESS,
      rev: obj.rev,
    };
  } catch {
    return null;
  }
}

function parseExercicioItem(item: NexurExercicioItem): LibraryExercise & { id: string } {
  const ex = item.exercicio;
  const name = ex.descricao_pt?.trim() || ex.descricao_en?.trim() || `Exercício ${ex.id_exercicio}`;
  const category = ex.classificacaoExercicio?.descricao_pt ?? ex.classificacaoExercicio?.descricao_en ?? '';
  const equipment = ex.tipoEquipamento?.descricao_pt ?? ex.tipoEquipamento?.descricao_en ?? '';

  return {
    id: String(item.id_exercicio_usuario),
    name,
    category,
    equipment,
    media1: parseMedia(ex.media1),
    media2: parseMedia(ex.media2),
    orientacoes: ex.orientacoes ?? '',
  };
}

// --- API calls ---
export async function fetchExercises(): Promise<(LibraryExercise & { id: string })[]> {
  const res = await fetch(`${API_BASE}/exercicio/index`, {
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar exercícios: ${res.status}`);
  }

  const data: { items: NexurExercicioItem[]; count: number } = await res.json();
  return data.items.filter((item) => item.ativo === 1).map(parseExercicioItem);
}
