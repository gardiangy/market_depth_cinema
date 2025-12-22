import { motion } from 'framer-motion';
import { AreaChart, TableProperties } from 'lucide-react';
import { useUIStore, type ViewMode } from '../../stores/uiStore';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ViewOptionProps {
  mode: ViewMode;
  currentMode: ViewMode;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ViewOption = ({ mode, currentMode, icon, label, onClick }: ViewOptionProps) => {
  const isActive = mode === currentMode;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`
            relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium transition-colors duration-200
            ${isActive
              ? 'text-white'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }
          `}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="sm:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

export const ViewToggle = () => {
  const { viewMode, setViewMode } = useUIStore();

  const options: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    {
      mode: 'depth-chart',
      icon: <AreaChart className="size-4" />,
      label: 'Depth Chart',
    },
    {
      mode: 'orderbook-table',
      icon: <TableProperties className="size-4" />,
      label: 'Orderbook',
    },
  ];

  // Calculate the position of the sliding indicator
  const activeIndex = options.findIndex((opt) => opt.mode === viewMode);

  return (
    <div className="relative flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--glass-border-color)]">
      {/* Animated sliding indicator */}
      <motion.div
        className="absolute h-[calc(100%-8px)] rounded-lg"
        initial={false}
        animate={{
          x: activeIndex === 0 ? 4 : 'calc(100% + 4px)',
          width: activeIndex === 0 ? 'calc(50% - 6px)' : 'calc(50% - 6px)',
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 35,
        }}
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          boxShadow: '0 0 20px var(--color-primary-glow), 0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Glow effect on the active indicator */}
      <motion.div
        className="absolute h-[calc(100%-8px)] rounded-lg pointer-events-none"
        initial={false}
        animate={{
          x: activeIndex === 0 ? 4 : 'calc(100% + 4px)',
          width: activeIndex === 0 ? 'calc(50% - 6px)' : 'calc(50% - 6px)',
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          x: { type: 'spring', stiffness: 500, damping: 35 },
          width: { type: 'spring', stiffness: 500, damping: 35 },
          opacity: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
        }}
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Toggle options */}
      {options.map((option) => (
        <ViewOption
          key={option.mode}
          mode={option.mode}
          currentMode={viewMode}
          icon={option.icon}
          label={option.label}
          onClick={() => setViewMode(option.mode)}
        />
      ))}
    </div>
  );
};

export default ViewToggle;
