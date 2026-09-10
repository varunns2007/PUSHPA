import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
}

export default function TabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-line/70 px-1">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            data-cursor-hover
            onClick={() => onChange(t.id)}
            className="relative px-3 py-2.5 font-mono text-[11px] tracking-[0.08em] transition-colors"
          >
            <span className={isActive ? "text-gold-400" : "text-ash-500 hover:text-ash-100"}>{t.label.toUpperCase()}</span>
            {isActive && (
              <motion.div layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-[2px] bg-gold-500" transition={{ type: "spring", stiffness: 400, damping: 35 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
