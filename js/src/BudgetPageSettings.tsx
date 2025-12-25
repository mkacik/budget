import React from "react";

import { Form } from "./ui/Form";

export type BudgetPageSettings = {
  showSettings: boolean;
  showCategorizationOnlyItems: boolean;
};

export function BudgetPageSettingsForm({
  settings,
  updateSettings,
}: {
  settings: BudgetPageSettings;
  updateSettings: (BudgetPageSettings) => void;
}) {
  const setShowCategorizationOnlyItems = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.currentTarget.checked;
    console.log(value);
    updateSettings({ ...settings, showCategorizationOnlyItems: value });
  };

  return (
    <div className="card section">
      <span>
        <b>Settings</b>
      </span>
      <small>Click on gear icon to hide settings section</small>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label>
          Show categorization-only budget items. Useful for budget creation if
          table feels cluttered
        </label>
        <input
          onChange={setShowCategorizationOnlyItems}
          type="checkbox"
          name="showCategorizationOnlyItems"
          defaultChecked={settings.showCategorizationOnlyItems}
        />
      </Form>
    </div>
  );
}
