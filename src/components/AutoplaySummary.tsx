import { Clock, Zap, Coffee, Layers } from 'lucide-react';
import type { AutoplayItem } from '../types/autoplay';

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return s > 0 ? `${m}min ${s}s` : `${m}min`;
  return `${s}s`;
}

export function AutoplaySummary({ items }: { items: AutoplayItem[] }) {
  const exercises = items.filter((i) => i.type === 'exercise');
  const rests = items.filter((i) => i.type === 'rest');

  const totalWork = exercises.reduce((acc, i) => acc + i.duration, 0);
  const totalRest = rests.reduce((acc, i) => acc + i.duration, 0);
  const totalDuration = totalWork + totalRest;

  return (
    <div className="w-80 h-screen bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 z-20 hidden xl:flex">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
          Resumo do Treino
        </h2>
      </div>

      <div className="p-4">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Layers size={16} className="text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">{items.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap size={16} className="text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">{exercises.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Exercícios</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock size={16} className="text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">{formatSeconds(totalDuration)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duração</p>
          </div>
        </div>

        {/* Work vs Rest breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="text-center p-3 bg-yellow-50 rounded-xl">
            <p className="text-sm font-bold text-gray-900">{formatSeconds(totalWork)}</p>
            <p className="text-[10px] text-yellow-600 uppercase tracking-wide">Trabalho</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-center gap-1">
              <Coffee size={12} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-900">{formatSeconds(totalRest)}</p>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Descanso</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4" />
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          Sequência
        </p>
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-[10px] text-gray-300 w-4 text-right shrink-0">
              {idx + 1}
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                item.type === 'exercise' ? 'bg-yellow-400' : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-gray-600 truncate flex-1">
              {item.type === 'exercise' ? item.name : item.label || 'Descanso'}
            </span>
            <span className="text-[10px] text-gray-400 shrink-0">
              {formatSeconds(item.duration)}
            </span>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-8">
            Adicione exercícios para ver o resumo
          </p>
        )}
      </div>
    </div>
  );
}
