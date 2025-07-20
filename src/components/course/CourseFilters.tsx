import React from 'react';
import { Filter, Search } from 'lucide-react';
import type { Category } from '../../types/course';

interface CourseFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  levelFilter: string;
  setLevelFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  categories: Category[];
  clearFilters: () => void;
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  levelFilter,
  setLevelFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  categories,
  clearFilters
}) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-blue-100 p-2 rounded-xl">
        <Filter className="h-5 w-5 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Filtres & Recherche</h3>
      {(searchTerm || categoryFilter || levelFilter || statusFilter || sortBy !== 'title') && (
        <button
          onClick={clearFilters}
          className="ml-auto text-sm text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-200 hover:border-blue-300 transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un cours..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
        />
      </div>

      {/* Filtre par catégorie */}
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
      >
        <option value="">Toutes les catégories</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {/* Filtre par niveau */}
      <select
        value={levelFilter}
        onChange={(e) => setLevelFilter(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
      >
        <option value="">Tous les niveaux</option>
        <option value="Débutant">Débutant</option>
        <option value="Intermédiaire">Intermédiaire</option>
        <option value="Avancé">Avancé</option>
      </select>

      {/* Tri */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
      >
        <option value="title">Trier par nom</option>
        <option value="progress">Trier par progression</option>
        <option value="recent">Récemment consultés</option>
        <option value="difficulty">Trier par difficulté</option>
      </select>
    </div>
  </div>
);

export default CourseFilters; 