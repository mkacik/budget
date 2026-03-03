import React from "react";
import { useState } from "react";

import { ExpensesQuery } from "./types/Expense";
import { AccountView, AccountsView } from "./AccountsView";
import { BudgetView } from "./BudgetView";
import { ExpensesList } from "./ExpensesList";
import { SettingsProvider, VersionedSettings } from "./SettingsProvider";
import {
  AddExpenseButton,
  ImportExpensesButton,
  DeleteExpensesButton,
} from "./ExpensesPageButtons";
import { LabeledSelect } from "./ui/Form";

import * as UI from "./ui/Common";

function AccountSelector({
  account,
  updateAccount,
  accounts,
}: {
  account: AccountView;
  updateAccount: (AccountView) => void;
  accounts: AccountsView;
}) {
  const setAccount = (e: React.SyntheticEvent) => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const newAccount = accounts.getAccount(id)!;
    updateAccount(newAccount);
  };

  return (
    <LabeledSelect
      label="Account"
      value={account.id}
      onChange={setAccount}
      style={{ width: "20%" }}
    >
      {accounts.accounts.map((account, idx) => (
        <option key={idx} value={account.id}>
          {account.name}
        </option>
      ))}
    </LabeledSelect>
  );
}

function ExpensesSection({
  account,
  updateAccount,
  accounts,
  budget,
}: {
  account: AccountView;
  updateAccount: (AccountView) => void;
  accounts: AccountsView;
  budget: BudgetView;
}) {
  // used to force remount of ExpensesList which will refetch data
  const [_, setLastUpdate] = useState<string>(Date());
  const markUpdated = () => setLastUpdate(Date());

  const query = {
    period: budget.year.toString(),
    selector: { variant: "Account", id: account.id },
  } as ExpensesQuery;

  const importButton =
    account.account_type === "Cash" ? (
      <AddExpenseButton account={account} onSuccess={markUpdated} />
    ) : (
      <ImportExpensesButton account={account} onSuccess={markUpdated} />
    );

  return (
    <UI.Section title="Expenses">
      <UI.Flex>
        <AccountSelector
          account={account}
          accounts={accounts}
          updateAccount={updateAccount}
        />
        {importButton}
        <DeleteExpensesButton account={account} onSuccess={markUpdated} />
      </UI.Flex>
      <ExpensesList budget={budget} query={query} />
    </UI.Section>
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
    return "Add accounts to enable imports and start categorizing";
  }

  return (
    <ExpensesSection
      account={selectedAccount}
      updateAccount={setSelectedAccount}
      accounts={accounts}
      budget={budget}
    />
  );
}
