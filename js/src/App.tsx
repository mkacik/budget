import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Accounts } from "./types/Account";
import { Budget } from "./types/Budget";
import { Funds } from "./types/Fund";
import { StatementSchemas } from "./types/StatementSchema";

import {
  getDefaultAppSettings,
  AppSettings,
  AppSettingsContext,
  Tab,
} from "./AppSettings";
import { AccountsPage } from "./AccountsPage";
import { AccountsView, AccountsViewContext } from "./AccountsView";
import { AnalyzePage } from "./AnalyzePage";
import { FundsPage } from "./FundsPage";
import { BudgetPage } from "./BudgetPage";
import { BudgetView } from "./BudgetView";
import { ExpensesPage } from "./ExpensesPage";
import { SettingsProvider } from "./SettingsProvider";
import { FetchHelper } from "./Common";

import * as UI from "./ui/Common";

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

function App() {
  // *** Bootstrap settings

  const settingsProvider = new SettingsProvider<AppSettings>(
    "settings",
    getDefaultAppSettings(),
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
  const [funds, setFunds] = useState<Funds | null>(null);
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [schemas, setSchemas] = useState<StatementSchemas | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = (newErrorMessage: string | null) => {
    if (errorMessage || newErrorMessage === null) {
      // if an error occurs while fetching data in top element there is no recovery path;
      // because of that there is no point in clearing or updating error message
      return;
    }
    setErrorMessage(
      "Fatal error has occured while fetching base application data. " +
        "Ensure that server is running and reload the page. Error details: " +
        newErrorMessage,
    );
  };

  const fetchHelper = new FetchHelper(handleError);

  const fetchBudget = () =>
    fetchHelper.fetch(new Request(`/api/budget/${year}`), (json) => {
      const budget = new BudgetView(json as Budget);
      setBudget(budget);
    });

  useEffect(() => {
    fetchBudget();
  }, [year]);

  const fetchAccounts = () =>
    fetchHelper.fetch(new Request("/api/accounts"), (json) =>
      setAccounts(json as Accounts),
    );

  const fetchSchemas = () =>
    fetchHelper.fetch(new Request("/api/schemas"), (json) =>
      setSchemas(json as StatementSchemas),
    );

  const fetchFunds = () =>
    fetchHelper.fetch(new Request("/api/funds"), (json) =>
      setFunds(json as Funds),
    );

  useEffect(() => {
    fetchAccounts();
    fetchSchemas();
    fetchFunds();
  }, []);

  useEffect(() => {
    const allFetched = [budget, accounts, schemas, funds].every((val) => val);
    if (allFetched || errorMessage) {
      setIsLoading(false);
    }
  }, [budget, accounts, schemas, funds, errorMessage]);

  const getPageContent = () => {
    if (
      budget === null ||
      accounts === null ||
      schemas === null ||
      funds === null
    ) {
      return null;
    }

    const accountsView = new AccountsView(accounts, schemas);

    switch (tab) {
      case Tab.Budget:
        return (
          <BudgetPage
            budget={budget}
            funds={funds.funds}
            refreshBudget={fetchBudget}
            setYear={setYear}
          />
        );
      case Tab.Expenses:
        // keep key in Expenses and in Analyze; without it the expenses/query from previously
        // selected year will linger until they are refreshed, causing mismatch with budget
        // that was already updated;
        return (
          <AccountsViewContext value={accountsView}>
            <ExpensesPage
              key={budget.year}
              budget={budget}
              accounts={accountsView}
            />
          </AccountsViewContext>
        );
      case Tab.Analyze:
        return (
          <AccountsViewContext value={accountsView}>
            <AnalyzePage
              key={budget.year}
              budget={budget}
              funds={funds.funds}
            />
          </AccountsViewContext>
        );
      case Tab.Accounts:
        return (
          <AccountsPage
            accounts={accounts.accounts}
            refreshAccounts={fetchAccounts}
            schemas={schemas.schemas}
            refreshSchemas={fetchSchemas}
          />
        );
      case Tab.Funds:
        return <FundsPage funds={funds.funds} refreshFunds={fetchFunds} />;
      default:
        return "404";
    }
  };

  return (
    <>
      <div className="header">
        <span className="flexrow">
          <UI.InlineGlyphButton
            glyph="chevron_left"
            onClick={() => setYear(year - 1)}
          />
          <span className="header-year">{year}</span>
          <UI.InlineGlyphButton
            glyph="chevron_right"
            onClick={() => setYear(year + 1)}
          />
        </span>

        <HeaderItem onClick={() => setTab(Tab.Budget)}>Budget</HeaderItem>
        <HeaderItem onClick={() => setTab(Tab.Expenses)}>Expenses</HeaderItem>
        <HeaderItem onClick={() => setTab(Tab.Analyze)}>Analyze</HeaderItem>

        <span className="header-spacer flexrow">︱</span>

        <HeaderItem onClick={() => setTab(Tab.Accounts)}>Accounts</HeaderItem>
        <HeaderItem onClick={() => setTab(Tab.Funds)}>Funds</HeaderItem>

        <span className="header-filler" />

        <HeaderItem>
          <form action="logout" method="post">
            <input type="submit" value="Logout" />
          </form>
        </HeaderItem>
      </div>

      <div className="main">
        <UI.ErrorCard message={errorMessage} />
        <UI.LoadingBanner isLoading={isLoading} />

        <AppSettingsContext value={settings}>
          {getPageContent()}
        </AppSettingsContext>
      </div>
    </>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
