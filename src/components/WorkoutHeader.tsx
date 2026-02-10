import React from 'react';
import { ArrowLeft, MoreVertical, Trash2, Plus, Tag } from 'lucide-react';
export function WorkoutHeader() {
  return (
    <div className="space-y-6 mb-6">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
              alt="User"
              className="w-8 h-8 rounded-full object-cover border border-gray-200" />

            <span className="font-semibold text-gray-900">Alana Souza.</span>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Title Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Editar treino
          </h1>
          <button className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Nome do treino
            </label>
            <input
              type="text"
              defaultValue="00 Novo treino 27 jan"
              className="w-full text-lg text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent" />

          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Início
              </label>
              <input
                type="text"
                placeholder="dd/MM/yyyy"
                className="w-full text-base text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent" />

            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Fim
              </label>
              <input
                type="text"
                placeholder="dd/MM/yyyy"
                className="w-full text-base text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent" />

            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Descrição
            </label>
            <textarea
              placeholder="Deixe aqui observações sobre este treino"
              className="w-full text-base text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent resize-none min-h-[60px]" />

          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
              Etiquetas
            </label>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <Plus size={14} />
                Atribuir
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <Tag size={14} />
                Etiquetas
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-400 italic">
              Clique no botão para adicionar etiquetas
            </p>
          </div>
        </div>
      </div>
    </div>);

}