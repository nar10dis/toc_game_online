export type GameSettings = {
  showCellIndexes: boolean;
  /** Shows the rule of the selected card. */
  showTutorial: boolean;
};

type SettingsMenuProps = {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
};

/** Display options of the game. Folds away on a click on its title, like the log. */
export function SettingsMenu({ settings, onChange }: SettingsMenuProps) {
  return (
    <details open className="mt-6 w-full">
      <summary className="cursor-pointer font-heading text-lg font-bold">Paramètres</summary>

      <div className="mt-2 flex flex-col gap-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.showCellIndexes}
            onChange={(event) => onChange({ ...settings, showCellIndexes: event.target.checked })}
          />
          Afficher les numéros de cases
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.showTutorial}
            onChange={(event) => onChange({ ...settings, showTutorial: event.target.checked })}
          />
          Afficher le tuto
        </label>
      </div>
    </details>
  );
}
