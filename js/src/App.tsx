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
import { ExpensesPage } from "./ExpensesPage";
import { SettingsProvider, VersionedSettings } from "./SettingsProvider";
import { InlineGlyphButton } from "./ui/Common";

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

interface AppSettings extends VersionedSettings {
  tab: Tab;
  year: number;
}

function App() {
  // *** Bootstrap settings

  const defaultSettings = {
    version: 2,
    tab: Tab.Budget,
    year: new Date().getFullYear(),
  } as AppSettings;

  const settingsProvider = new SettingsProvider<AppSettings>(
    "settings",
    defaultSettings,
  );

  const [settings, setSettings] = useState<AppSettings>(
    settingsProvider.getSettings(),
  );

  const updateSettings = (settings: AppSettings) => {
    settingsProvider.saveSettings(settings);
    setSettings(settings);
  };

  const tab = settings.tab;
  const year = settings.year;

  const setTab = (tab: Tab) => updateSettings({ ...settings, tab: tab });
  const setYear = (year: number) => updateSettings({ ...settings, year: year });

  // *** Fetch data

  const [budget, setBudget] = useState<BudgetView | null>(null);
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [schemas, setSchemas] = useState<StatementSchemas | null>(null);

  const fetchBudget = () => {
    fetch(`/api/budget/${year}`)
      .then((response) => response.json())
      .then((result) => {
        const budget = new BudgetView(result as Budget);
        setBudget(budget);
      });
  };

  useEffect(() => {
    fetchBudget();
  }, [year]);

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

  if (budget === null || accounts === null || schemas === null) {
    return null;
  }

  const accountsView = new AccountsView(accounts, schemas);

  return (
    <>
      <div className="header">
        <HeaderItem onClick={() => setTab(Tab.Budget)}>Budget</HeaderItem>
        <HeaderItem onClick={() => setTab(Tab.Expenses)}>Expenses</HeaderItem>
        <HeaderItem onClick={() => setTab(Tab.Accounts)}>Accounts</HeaderItem>
        <HeaderItem onClick={() => setTab(Tab.Analyze)}>Analyze</HeaderItem>

        <span className="flexrow">
          <InlineGlyphButton
            glyph="chevron_left"
            onClick={() => setYear(year - 1)}
          />
          {year}
          <InlineGlyphButton
            glyph="chevron_right"
            onClick={() => setYear(year + 1)}
          />
        </span>

        <span className="header-filler" />

        <HeaderItem>
          <form action="logout" method="post">
            <input type="submit" value="Logout" />
          </form>
        </HeaderItem>
      </div>

      <div className="main">
        {tab == Tab.Budget && (
          <BudgetPage budget={budget} refreshBudget={fetchBudget} />
        )}
        {tab == Tab.Expenses && (
          // keep key here and in analyze; without it the expenses/query from previously selected
          // year will linger until they are refreshed, causing mismatch with budget that was
          // already updated;
          <ExpensesPage
            key={`expenses.${budget.year}`}
            budget={budget}
            accounts={accountsView}
          />
        )}
        {tab == Tab.Accounts && (
          <AccountsPage
            accounts={accounts.accounts}
            refreshAccounts={fetchAccounts}
            schemas={schemas.schemas}
            refreshSchemas={fetchSchemas}
          />
        )}
        {tab == Tab.Analyze && (
          <AnalyzePage key={`analyze.${budget.year}`} budget={budget} />
        )}
      </div>
    </>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
