import React from "react";

import { Form, LabeledInput } from "./ui/Form";

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
    <Form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <LabeledInput
        label="Show categorization-only budget items. Useful for budget creation if table feels cluttered"
        onChange={setShowCategorizationOnlyItems}
        type="checkbox"
        name="showCategorizationOnlyItems"
        defaultChecked={settings.showCategorizationOnlyItems}
      />
    </Form>
  );
}
