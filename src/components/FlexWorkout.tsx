import { GripVertical, Trash2, Copy, Edit2, Dumbbell } from 'lucide-react';
import { FlexExercise } from '../types/workout';
import { motion } from 'framer-motion';
import { MediaPreview } from './MediaPreview';
import { MOCK_EXERCISE } from '../data/mockExercise';

const MOCK_FLEX_EXERCISES: FlexExercise[] = [
{
  id: '1',
  name: MOCK_EXERCISE.title,
  media1: MOCK_EXERCISE.media1,
  media2: MOCK_EXERCISE.media2,
  category: MOCK_EXERCISE.exerciseCategoryText,
  equipment: MOCK_EXERCISE.equipmentTypeText,
  methodology: '',
  reps: '',
  load: '',
  interval: '',
  notes: ''
},
{
  id: '2',
  name: MOCK_EXERCISE.title,
  media1: MOCK_EXERCISE.media1,
  media2: MOCK_EXERCISE.media2,
  category: MOCK_EXERCISE.exerciseCategoryText,
  equipment: MOCK_EXERCISE.equipmentTypeText,
  methodology: 'Pirâmide',
  reps: '12/10/8',
  load: '40kg',
  interval: '60s',
  notes: 'Foco na fase excêntrica'
}];

export function FlexWorkout() {
  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-4 mb-4">
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <Edit2 size={16} />
          Editar
        </button>
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <Dumbbell size={16} />
          Treinar
        </button>
      </div>

      <div className="space-y-8">
        {MOCK_FLEX_EXERCISES.map((exercise) =>
        <motion.div
          key={exercise.id}
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="flex flex-col gap-4 py-4 rounded-lg bg-white">

            {/* Title row */}
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {exercise.name}
            </h3>

            {/* Content row: Thumbnail | Form | Actions */}
            <div className="flex gap-x-4">
              {/* Thumbnail */}
              <div className="w-36 h-36 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <MediaPreview media={exercise.media1} alt={exercise.name} />
              </div>

              {/* Form fields */}
              <div className="flex-1 flex flex-col gap-y-3 min-w-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Metodologia
                    </label>
                    <input
                    type="text"
                    defaultValue={exercise.methodology}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all" />
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Repetições
                    </label>
                    <input
                    type="text"
                    defaultValue={exercise.reps}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Carga
                    </label>
                    <input
                    type="text"
                    defaultValue={exercise.load}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all" />
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Intervalo
                    </label>
                    <input
                    type="text"
                    defaultValue={exercise.interval}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all" />
                  </div>
                </div>

                <div className="flex flex-col gap-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Observações
                  </label>
                  <textarea
                  defaultValue={exercise.notes}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all resize-none h-16" />
                </div>
              </div>

              {/* Action buttons column */}
              <div className="grid grid-rows-3 items-center justify-center flex-shrink-0">
                <button className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors">
                  <GripVertical size={18} />
                </button>
                <button className="flex items-center justify-center p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
                <button className="flex items-center justify-center p-2 text-gray-300 hover:text-blue-500 transition-colors">
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>);

}