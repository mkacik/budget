import React from "react";
import { useState } from "react";

import { AccountView, AccountsView } from "./AccountsView";
import { BudgetView } from "./BudgetView";
import { ExpensesQuery, ExpensesList } from "./ExpensesList";
import { SettingsProvider, VersionedSettings } from "./SettingsProvider";
import { Section, SectionHeader } from "./ui/Common";

function AccountSelector({
  accounts,
  selected,
  updateSelected,
}: {
  accounts: AccountsView;
  selected: AccountView;
  updateSelected: (AccountView) => void;
}) {
  const onSelectChange = (e: React.SyntheticEvent) => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const account = accounts.getAccount(id)!;
    updateSelected(account);
  };

  return (
    <select onChange={onSelectChange} value={selected.id}>
      {accounts.accounts.map((account, idx) => (
        <option key={idx} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}

interface ExpensesPageSettings extends VersionedSettings {
  account_id: number | null;
}

export function ExpensesPage({
  budget,
  accounts,
}: {
  budget: BudgetView;
  accounts: AccountsView;
}) {
  // *** Bootstrap settings

  const defaultSettings = {
    version: 1,
    account_id: accounts.firstOrNull()?.id || null,
  } as ExpensesPageSettings;

  const settingsProvider = new SettingsProvider<ExpensesPageSettings>(
    "expenses_page_settings",
    defaultSettings,
  );

  const [settings, setSettings] = useState<ExpensesPageSettings>(
    settingsProvider.getSettings(),
  );

  const updateSettings = (settings: ExpensesPageSettings) => {
    settingsProvider.saveSettings(settings);
    setSettings(settings);
  };

  // computed based on settings, can involve setState
  let selectedAccount: AccountView | null = null;

  const setSelectedAccount = (account: AccountView) => {
    updateSettings({ ...settings, account_id: account.id });
  };

  const savedAccountID = settings.account_id;
  const savedAccountEmptyOrInvalid =
    savedAccountID === null || !accounts.hasAccount(savedAccountID);
  if (savedAccountEmptyOrInvalid) {
    selectedAccount = accounts.firstOrNull();
    // only save when new account is not null, to avoid re-render loop when accounts
    // list is empty
    if (selectedAccount !== null) {
      setSelectedAccount(selectedAccount);
    }
  } else {
    selectedAccount = accounts.getAccount(savedAccountID);
  }

  if (selectedAccount === null) {
    return <>{"Add accounts to enable imports and start categorizing"}</>;
  }

  const expensesQuery = {
    variant: "account",
    account: selectedAccount,
    year: budget.year,
  } as ExpensesQuery;

  return (
    <>
      <Section>
        <SectionHeader>Expenses</SectionHeader>
        <div className="flexrow">
          Account
          <AccountSelector
            accounts={accounts}
            selected={selectedAccount}
            updateSelected={setSelectedAccount}
          />
        </div>
      </Section>

      <Section>
        <ExpensesList budget={budget} query={expensesQuery} />
      </Section>
    </>
  );
}
