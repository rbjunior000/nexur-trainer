import { Play, Flame, CornerDownRight } from 'lucide-react';
import { useTrainingSession } from './TrainingSessionContext';
import { CountdownDisplay } from './CountdownDisplay';
import { MediaCarousel } from '../MediaCarousel';
import { PseBadgeWithPicker } from '../PsePicker';
import { formatRest } from '../shared/RestTimerBadge';

function formatRestLocal(seconds: number): string {
  if (seconds <= 0) return 'OFF';
  if (seconds >= 60) return `${Math.floor(seconds / 60)}min`;
  return `${seconds}s`;
}

/**
 * Guided view: one set at a time, full media, timer, stats.
 */
export function GuidedView() {
  const {
    exercises,
    supersets,
    focusSteps,
    currentStep,
    currentStepIdx,
    phase,
    countdown,
    updateSetField,
  } = useTrainingSession();

  if (!currentStep) return null;

  const currentExercise = exercises[currentStep.exerciseIndex];
  const currentSet = currentExercise?.sets[currentStep.setIndex];
  const isRestStep = currentStep.isRestStep === true;
  const restDisplay =
    phase === 'rest' && countdown !== null
      ? countdown
      : currentStep.restStepDuration ?? 0;

  // Build next step label
  const nextStepIdx = currentStepIdx + 1;
  const nextStep = focusSteps[nextStepIdx];
  const nextExercise = nextStep ? exercises[nextStep.exerciseIndex] : null;
  const nextStepLabel = nextStep?.isRestStep
    ? 'Descanso'
    : nextExercise?.name ?? '';

  // Superset info
  const ss = currentExercise
    ? supersets.find((s) => s.exerciseIds.includes(currentExercise.id))
    : null;
  const ssIndices = ss
    ? ss.exerciseIds.map((id) => exercises.findIndex((e) => e.id === id)).filter((i) => i >= 0)
    : [];
  const posInSS = ss ? ssIndices.indexOf(currentStep.exerciseIndex) + 1 : 0;
  const totalInSS = ssIndices.length;
  const setIdx = currentStep.setIndex;
  const totalSets = currentExercise?.sets.length ?? 0;

  // Rest state (between sets or rest block)
  if (isRestStep || phase === 'rest') {
    return (
      <CountdownDisplay
        value={restDisplay}
        label={isRestStep ? 'Bloco de Descanso' : 'Descanso'}
        nextStepLabel={nextStepLabel}
      />
    );
  }

  if (!currentExercise || !currentSet) return null;

  const hasWeight =
    currentExercise.type === 'duration' && (currentSet.weight ?? 0) > 0;

  const inputCls =
    'w-full bg-transparent font-bold text-lg text-center focus:outline-none focus:text-yellow-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <div className="flex flex-col">
      {/* Title */}
      <div className="px-4 py-4">
        {ss && (
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">
            Superset · Exercício {posInSS} de {totalInSS}
          </p>
        )}
        <p className="text-yellow-400 text-2xl font-bold flex items-center gap-2">
          {ss ? (
            `Round ${setIdx + 1} de ${ss.rounds}`
          ) : currentSet.type === 'warmup' ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <Flame size={20} />
                Aquecimento
              </span>
              <span className="text-gray-500 text-lg">
                {setIdx + 1}/{totalSets}
              </span>
            </>
          ) : currentSet.type === 'dropset' ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-orange-400">
                <CornerDownRight size={20} />
                Drop Set
              </span>
              <span className="text-gray-500 text-lg">
                Série {setIdx + 1}/{totalSets}
              </span>
            </>
          ) : (
            `Série ${setIdx + 1} de ${totalSets}`
          )}
        </p>
      </div>

      <div className="h-px bg-gray-800" />

      {/* Media */}
      {currentExercise.media1 || currentExercise.media2 ? (
        <MediaCarousel
          items={[currentExercise.media1, currentExercise.media2]}
          alt={currentExercise.name}
          playable
        />
      ) : (
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <Play size={28} className="text-gray-600 ml-0.5" />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-900 px-4 pt-5 pb-6 space-y-5">
        <h2 className="text-2xl font-bold text-white">{currentExercise.name}</h2>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {currentExercise.type === 'weight_reps' && (
            <>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Carga (kg)</p>
                <input
                  type="number"
                  value={currentSet.weight ?? 0}
                  onChange={(e) =>
                    updateSetField(currentStep.exerciseIndex, currentStep.setIndex, 'weight', Number(e.target.value) || 0)
                  }
                  className={`${inputCls} text-white`}
                />
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Reps</p>
                <input
                  type="number"
                  value={currentSet.reps ?? 0}
                  placeholder={
                    currentExercise.repsMode === 'range' && currentSet.repsRange
                      ? `${currentSet.repsRange[0]}-${currentSet.repsRange[1]}`
                      : undefined
                  }
                  onChange={(e) =>
                    updateSetField(currentStep.exerciseIndex, currentStep.setIndex, 'reps', Number(e.target.value) || 0)
                  }
                  className={`${inputCls} text-yellow-400`}
                />
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Inter</p>
                <p className="text-white font-bold text-lg">{formatRestLocal(currentSet.rest)}</p>
              </div>
            </>
          )}

          {currentExercise.type === 'duration' && (
            <>
              {hasWeight && (
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Carga (kg)</p>
                  <input
                    type="number"
                    value={currentSet.weight ?? 0}
                    onChange={(e) =>
                      updateSetField(currentStep.exerciseIndex, currentStep.setIndex, 'weight', Number(e.target.value) || 0)
                    }
                    className={`${inputCls} text-white`}
                  />
                </div>
              )}
              <div className={`bg-gray-800 rounded-xl p-3 text-center ${!hasWeight ? 'col-span-2' : ''}`}>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Duração</p>
                <p className="text-yellow-400 font-bold text-lg">
                  {countdown !== null ? countdown : (currentSet.duration || '00:00')}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Inter</p>
                <p className="text-white font-bold text-lg">{formatRestLocal(currentSet.rest)}</p>
              </div>
            </>
          )}

          {currentExercise.type === 'distance' && (
            <>
              <div className="bg-gray-800 rounded-xl p-3 text-center col-span-2">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Distância (km)</p>
                <input
                  type="number"
                  value={currentSet.distance ?? 0}
                  onChange={(e) =>
                    updateSetField(currentStep.exerciseIndex, currentStep.setIndex, 'distance', Number(e.target.value) || 0)
                  }
                  className={`${inputCls} text-yellow-400`}
                />
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Inter</p>
                <p className="text-white font-bold text-lg">{formatRestLocal(currentSet.rest)}</p>
              </div>
            </>
          )}
        </div>

        {/* PSE */}
        <div className="bg-gray-800 rounded-xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">PSE</p>
            <p className="text-gray-400 text-xs mt-0.5">Percepção Subjetiva de Esforço</p>
          </div>
          <PseBadgeWithPicker
            value={currentSet.pse}
            onChange={(v) =>
              updateSetField(currentStep.exerciseIndex, currentStep.setIndex, 'pse', v)
            }
          />
        </div>

        {/* Dropsets */}
        {currentSet.type === 'dropset' && (currentSet.dropsets ?? []).length > 0 && (
          <div className="space-y-2">
            {(currentSet.dropsets ?? []).map((drop, di) => (
              <div
                key={drop.id}
                className="flex items-center gap-3 bg-orange-950/30 border border-orange-800/30 rounded-xl px-4 py-2"
              >
                <CornerDownRight size={14} className="text-orange-500 shrink-0" />
                <span className="text-orange-400 text-xs font-semibold uppercase">Drop {di + 1}</span>
                {currentExercise.type === 'weight_reps' && (
                  <>
                    <span className="text-white text-sm font-bold ml-auto">{drop.weight ?? 0}kg</span>
                    <span className="text-gray-400 text-sm">
                      ×{' '}
                      {drop.repsRange
                        ? `${drop.repsRange[0]}-${drop.repsRange[1]}`
                        : (drop.reps ?? 0)}
                    </span>
                  </>
                )}
                {currentExercise.type === 'duration' && (
                  <span className="text-white text-sm font-bold ml-auto">{drop.duration || '—'}</span>
                )}
                {currentExercise.type === 'distance' && (
                  <span className="text-white text-sm font-bold ml-auto">{drop.distance ?? 0}m</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes / Orientações */}
        {currentExercise.notes && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Notas</p>
            <p className="text-gray-300 text-sm">{currentExercise.notes}</p>
          </div>
        )}
        {currentExercise.orientacoes && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Orientações</p>
            <p className="text-gray-300 text-sm">{currentExercise.orientacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
