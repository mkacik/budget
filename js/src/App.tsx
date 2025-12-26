import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Accounts } from "./types/Account";
import { Budget } from "./types/Budget";
import { StatementSchemas } from "./types/StatementSchema";

import { AccountsPage } from "./AccountsPage";
import { AccountsView } from "./AccountsView";
import { AnalyzePage } from "./AnalyzePage";
import { BudgetPage } from "./BudgetPage";
import { BudgetView } from "./BudgetView";
import { BudgetViewContext } from "./BudgetViewContext";
import { ExpensesPage } from "./ExpensesPage";
import {
  AppSettingsProvider,
  AppSettingsVersioned,
} from "./AppSettingsProvider";

function HeaderItem({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <span className="header-item" onClick={onClick}>
      {children}
    </span>
  );
}

enum Tab {
  Budget,
  Accounts,
  Expenses,
  Analyze,
}

interface AppSettings extends AppSettingsVersioned {
  tab: Tab;
}

const SETTINGS_STORAGE_KEY = "BUDGETAPP.settings";
const DEFAULT_SETTINGS = {
  version: 1,
  tab: Tab.Expenses,
} as AppSettings;

function App() {
  const settingsProvider = new AppSettingsProvider<AppSettings>(
    SETTINGS_STORAGE_KEY,
    DEFAULT_SETTINGS,
  );
  const [settings, setSettings] = useState<AppSettings>(
    settingsProvider.getSettings(),
  );
  const [tab, setTab] = useState<Tab>(settings.tab);

  const [budget, setBudget] = useState<BudgetView | null>(null);
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [schemas, setSchemas] = useState<StatementSchemas | null>(null);

  const fetchBudget = () => {
    fetch("/api/budget")
      .then((response) => response.json())
      .then((result) => {
        const budget = new BudgetView(result as Budget);
        setBudget(budget);
      });
  };

  useEffect(() => {
    if (budget === null) {
      fetchBudget();
    }
  }, []);

  const fetchAccounts = () => {
    fetch("/api/accounts")
      .then((response) => response.json())
      .then((result) => {
        setAccounts(result as Accounts);
      });
  };

  useEffect(() => {
    if (accounts === null) {
      fetchAccounts();
    }
  }, []);

  const fetchSchemas = () => {
    fetch("/api/schemas")
      .then((response) => response.json())
      .then((result) => {
        setSchemas(result as StatementSchemas);
      });
  };

  useEffect(() => {
    if (schemas === null) {
      fetchSchemas();
    }
  }, []);

  const updateSettings = (settings: AppSettings) => {
    settingsProvider.saveSettings(settings);
    setSettings(settings);
  };

  const updateTab = (tab: Tab) => () => {
    updateSettings({ ...settings, tab: tab });
    setTab(tab);
  };

  if (budget === null || accounts === null || schemas === null) {
    return null;
  }

  const accountsView = new AccountsView(accounts, schemas);

  return (
    <>
      <div className="header">
        <HeaderItem onClick={updateTab(Tab.Budget)}>Budget</HeaderItem>
        <HeaderItem onClick={updateTab(Tab.Expenses)}>Expenses</HeaderItem>
        <HeaderItem onClick={updateTab(Tab.Accounts)}>Accounts</HeaderItem>
        <HeaderItem onClick={updateTab(Tab.Analyze)}>Analyze</HeaderItem>
        <span className="header-filler" />
        <HeaderItem>
          <form action="logout" method="post">
            <input type="submit" value="Logout" />
          </form>
        </HeaderItem>
      </div>
      <div className="main">
        <BudgetViewContext.Provider value={budget}>
          {tab == Tab.Budget && (
            <BudgetPage budget={budget} refreshBudget={fetchBudget} />
          )}
          {tab == Tab.Expenses && <ExpensesPage accounts={accountsView} />}
          {tab == Tab.Accounts && (
            <AccountsPage
              accounts={accounts.accounts}
              refreshAccounts={fetchAccounts}
              schemas={schemas.schemas}
              refreshSchemas={fetchSchemas}
            />
          )}
          {tab == Tab.Analyze && <AnalyzePage budget={budget} />}
        </BudgetViewContext.Provider>
      </div>
    </>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
