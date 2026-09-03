import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Command, Search, X } from 'lucide-react';
import { filterWorkspaceCommands, type WorkspaceCommand } from '../../services/workspace-commands';

interface CommandPaletteProps {
  open: boolean;
  commands: readonly WorkspaceCommand[];
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, commands, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => filterWorkspaceCommands(commands, query), [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const execute = (command: WorkspaceCommand) => {
    if (command.disabled) return;
    command.run();
    onClose();
  };

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <header>
          <Search size={17} />
          <input
            ref={inputRef}
            aria-label="Search commands"
            placeholder="Search tools, floors, views and actions…"
            value={query}
            onChange={event => { setQuery(event.target.value); setActiveIndex(0); }}
            onKeyDown={event => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, results.length - 1)); }
              if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
              if (event.key === 'Enter' && results[activeIndex]) execute(results[activeIndex]);
            }}
          />
          <kbd>Ctrl K</kbd>
          <button onClick={onClose} aria-label="Close command palette"><X size={16} /></button>
        </header>
        <div className="command-results" role="listbox" aria-label="Available commands">
          {results.map((command, index) => (
            <button
              key={command.id}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'active' : ''}
              disabled={command.disabled}
              title={command.disabledReason}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => execute(command)}
            >
              <span><Command size={14} /><strong>{command.label}</strong><small>{command.group}</small></span>
              {command.disabled ? <em>{command.disabledReason ?? 'Unavailable'}</em> : command.shortcut && <kbd>{command.shortcut}</kbd>}
            </button>
          ))}
          {results.length === 0 && <p>No supported command matches “{query}”.</p>}
        </div>
        <footer>↑↓ Navigate <span>↵ Run</span><span>Esc Close</span></footer>
      </section>
    </div>
  );
};
