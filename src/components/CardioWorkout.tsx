import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Footprints,
  Bike,
  Waves,
  Ship,
  Activity,
  Mountain,
  Clock,
  MapPin,
  Heart,
  ChevronDown,
  ChevronUp,
  Watch,
  Smartphone } from
'lucide-react';
import { CardioSession, CardioActivityType } from '../types/workout';
const ACTIVITIES: {
  type: CardioActivityType;
  icon: any;
  label: string;
}[] = [
{
  type: 'running',
  icon: Footprints,
  label: 'Corrida'
},
{
  type: 'cycling',
  icon: Bike,
  label: 'Ciclismo'
},
{
  type: 'swimming',
  icon: Waves,
  label: 'Natação'
},
{
  type: 'rowing',
  icon: Ship,
  label: 'Remo'
},
{
  type: 'walking',
  icon: Activity,
  label: 'Caminhada'
},
{
  type: 'hiking',
  icon: Mountain,
  label: 'Trilha'
}];

export function CardioWorkout() {
  const [selectedActivity, setSelectedActivity] =
  useState<CardioActivityType>('running');
  const [targetType, setTargetType] = useState<'duration' | 'distance'>(
    'duration'
  );
  const [showIntervals, setShowIntervals] = useState(false);
  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-20">
      {/* Activity Selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ACTIVITIES.map(({ type, icon: Icon, label }) =>
        <button
          key={type}
          onClick={() => setSelectedActivity(type)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedActivity === type ? 'bg-yellow-50 border-yellow-400 text-yellow-700 ring-1 ring-yellow-400' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>

            <Icon size={24} className="mb-2" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        )}
      </div>

      {/* Target Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Meta do Treino</h3>

        <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setTargetType('duration')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${targetType === 'duration' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>

            Duração
          </button>
          <button
            onClick={() => setTargetType('distance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${targetType === 'distance' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>

            Distância
          </button>
        </div>

        <div className="flex items-center gap-4">
          {targetType === 'duration' ?
          <div className="flex items-center gap-2">
              <div className="relative">
                <input
                type="number"
                placeholder="00"
                className="w-16 h-16 text-center text-3xl font-bold bg-gray-50 rounded-xl border border-gray-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none" />

                <span className="absolute -bottom-6 left-0 w-full text-center text-xs text-gray-400 uppercase">
                  Horas
                </span>
              </div>
              <span className="text-2xl font-bold text-gray-300">:</span>
              <div className="relative">
                <input
                type="number"
                placeholder="30"
                className="w-16 h-16 text-center text-3xl font-bold bg-gray-50 rounded-xl border border-gray-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none" />

                <span className="absolute -bottom-6 left-0 w-full text-center text-xs text-gray-400 uppercase">
                  Min
                </span>
              </div>
              <span className="text-2xl font-bold text-gray-300">:</span>
              <div className="relative">
                <input
                type="number"
                placeholder="00"
                className="w-16 h-16 text-center text-3xl font-bold bg-gray-50 rounded-xl border border-gray-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none" />

                <span className="absolute -bottom-6 left-0 w-full text-center text-xs text-gray-400 uppercase">
                  Seg
                </span>
              </div>
            </div> :

          <div className="flex items-center gap-4">
              <div className="relative">
                <input
                type="number"
                placeholder="5.0"
                className="w-32 h-16 text-center text-3xl font-bold bg-gray-50 rounded-xl border border-gray-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none" />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  km
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Ritmo estimado:{' '}
                <span className="font-bold text-gray-900">5:30 /km</span>
              </div>
            </div>
          }
        </div>
      </div>

      {/* Intervals Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowIntervals(!showIntervals)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Activity size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900">Intervalos</h3>
              <p className="text-sm text-gray-500">
                Configurar aquecimento, tiros e descanso
              </p>
            </div>
          </div>
          {showIntervals ?
          <ChevronUp size={20} className="text-gray-400" /> :

          <ChevronDown size={20} className="text-gray-400" />
          }
        </button>

        <AnimatePresence>
          {showIntervals &&
          <motion.div
            initial={{
              height: 0
            }}
            animate={{
              height: 'auto'
            }}
            exit={{
              height: 0
            }}
            className="overflow-hidden">

              <div className="p-6 pt-0 border-t border-gray-100 space-y-4">
                {['Aquecimento', 'Trabalho', 'Descanso', 'Volta à calma'].map(
                (label, i) =>
                <div key={label} className="flex items-center gap-4">
                      <span className="w-24 text-sm font-medium text-gray-600">
                        {label}
                      </span>
                      <input
                    type="text"
                    placeholder="Duração"
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400" />

                      <input
                    type="text"
                    placeholder="Intensidade"
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400" />

                    </div>

              )}
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>

      {/* Export Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="font-bold text-lg mb-4">Sincronizar Dispositivo</h3>
        <p className="text-gray-400 text-sm mb-6">
          Envie este treino diretamente para seu relógio.
        </p>

        <div className="flex gap-4">
          <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center gap-2 transition-colors border border-white/10">
            <Watch size={24} className="text-blue-400" />
            <span className="text-xs font-medium">Garmin</span>
          </button>
          <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center gap-2 transition-colors border border-white/10">
            <Watch size={24} className="text-gray-200" />
            <span className="text-xs font-medium">Apple</span>
          </button>
          <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center gap-2 transition-colors border border-white/10">
            <Smartphone size={24} className="text-green-400" />
            <span className="text-xs font-medium">Outros</span>
          </button>
        </div>
      </div>
    </div>);

}