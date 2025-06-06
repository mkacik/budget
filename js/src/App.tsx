import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Accounts } from "./types/Account";
import { Budget } from "./types/Budget";
import { StatementSchemas } from "./types/StatementSchema";

import { BudgetView } from "./BudgetView";

import { AccountsPage } from "./AccountsPage";
import { BudgetPage } from "./BudgetPage";
import { ExpensesPage } from "./ExpensesPage";
import { AnalyzePage } from "./AnalyzePage";

enum Tab {
  Budget,
  Accounts,
  Expenses,
  Schemas,
  Analyze,
}

function render_if(condition: boolean, element: React.ReactNode) {
  return condition ? element : null;
}

function App() {
  const [budget, setBudget] = useState<BudgetView | null>(null);
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [schemas, setSchemas] = useState<StatementSchemas | null>(null);

  const [tab, setTab] = useState<Tab>(Tab.Expenses);

  const fetchBudget = () => {
    fetch("/api/budget")
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        const budget = new BudgetView(result as Budget);
        setBudget(budget);
      });
  };

  useEffect(() => {
    if (budget === null) {
      fetchBudget();
    }
  }, [budget, setBudget]);

  const fetchAccounts = () => {
    fetch("/api/accounts")
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        setAccounts(result as Accounts);
      });
  };

  useEffect(() => {
    if (accounts === null) {
      fetchAccounts();
    }
  }, [accounts, setAccounts]);

  const fetchSchemas = () => {
    fetch("/api/schemas")
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        setSchemas(result as StatementSchemas);
      });
  };

  useEffect(() => {
    if (schemas === null) {
      fetchSchemas();
    }
  }, [schemas, setSchemas]);

  if (budget === null || accounts === null || schemas === null) {
    return null;
  }

  const budgetPage = <BudgetPage budget={budget} refreshBudget={fetchBudget} />;
  const expensesPage = (
    <ExpensesPage
      accounts={accounts.accounts}
      schemas={schemas.schemas}
      budget={budget}
    />
  );
  const accountsPage = (
    <AccountsPage
      accounts={accounts.accounts}
      refreshAccounts={fetchAccounts}
      schemas={schemas.schemas}
      refreshSchemas={fetchSchemas}
    />
  );
  const analyzePage = <AnalyzePage budget={budget} />;

  return (
    <>
      <div className="header">
        <span className="header-item" onClick={() => setTab(Tab.Budget)}>
          Budget
        </span>
        <span className="header-item" onClick={() => setTab(Tab.Expenses)}>
          Expenses
        </span>
        <span className="header-item" onClick={() => setTab(Tab.Accounts)}>
          Accounts
        </span>
        <span className="header-item" onClick={() => setTab(Tab.Analyze)}>
          Analyze
        </span>
        <span className="header-filler" />
        <span className="header-item">
          <form action="logout" method="post">
            <input type="submit" value="Logout" />
          </form>
        </span>
      </div>
      <div className="main">
        {render_if(tab == Tab.Budget, budgetPage)}
        {render_if(tab == Tab.Expenses, expensesPage)}
        {render_if(tab == Tab.Accounts, accountsPage)}
        {render_if(tab == Tab.Analyze, analyzePage)}
      </div>
    </>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
