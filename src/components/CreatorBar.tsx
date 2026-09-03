import React from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { Creator } from "../types";

interface CreatorBarProps {
  creators: Creator[];
  selectedCreatorId: string | null;
  onSelectCreator: (id: string | null) => void;
  onOpenAddModal: () => void;
  onRemoveCreator: (id: string) => void;
}

export const CreatorBar: React.FC<CreatorBarProps> = ({
  creators,
  selectedCreatorId,
  onSelectCreator,
  onOpenAddModal,
  onRemoveCreator,
}) => {
  return (
    <div className="w-full flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none select-none">
      {/* "All Creators" button */}
      <button
        onClick={() => onSelectCreator(null)}
        className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border text-xs font-semibold shrink-0 transition-all cursor-pointer ${
          selectedCreatorId === null
            ? "bg-violet-500/15 border-violet-500/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30"
            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white"
        }`}
      >
        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/80">
          <Users className="w-3.5 h-3.5" />
        </div>
        <span>Toutes les vidéos</span>
      </button>

      {/* Individual Creator Pills */}
      {creators.map((creator) => {
        const isSelected = selectedCreatorId === creator.id;
        return (
          <div
            key={creator.id}
            className={`group relative flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              isSelected
                ? "bg-violet-500/15 border-violet-500/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30"
                : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white"
            }`}
            onClick={() => onSelectCreator(creator.id)}
          >
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-7 h-7 rounded-xl object-cover border border-white/10"
            />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-white leading-tight">{creator.name}</span>
              <span className="text-[10px] text-violet-400 font-mono leading-none mt-0.5">
                {creator.subscribers}
              </span>
            </div>

            {/* Remove creator button on hover if not last creator */}
            {creators.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCreator(creator.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition"
                title={`Retirer ${creator.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add Creator Button */}
      <button
        onClick={onOpenAddModal}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-dashed border-white/20 hover:border-violet-500/50 text-white/50 hover:text-white text-xs font-semibold shrink-0 transition-all cursor-pointer bg-white/[0.02]"
      >
        <Plus className="w-3.5 h-3.5 text-violet-400" />
        <span>+ Ajouter un Vidéaste</span>
      </button>
    </div>
  );
};
