import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Accounts } from "./types/Account";
import { Budget } from "./types/Budget";
import { StatementSchemas } from "./types/StatementSchema";

import { BudgetCard } from "./BudgetCard";
import { BudgetView } from "./BudgetView";
import { AccountsCard } from "./AccountsCard";
import { ExpensesCard } from "./ExpensesCard";
import { StatementSchemasCard } from "./StatementSchemasCard";

enum Tab {
  Budget,
  Accounts,
  Expenses,
  Schemas,
}

function render_if(condition: boolean, element: React.ReactNode) {
  return condition ? element : null;
}

function App() {
  const [budget, setBudget] = useState<BudgetView | null>(null);
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [schemas, setSchemas] = useState<StatementSchemas | null>(null);

  const [tab, setTab] = useState<Tab>(Tab.Expenses);

  useEffect(() => {
    if (budget === null) {
      fetch("/api/budget")
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          const budget = new BudgetView(result as Budget);
          setBudget(budget);
        });
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

  const budgetCard = <BudgetCard budget={budget} />;
  const expensesCard = (
    <ExpensesCard
      allAccounts={accounts}
      budgetItems={budget.getBudgetItemsForCategorization()}
    />
  );
  const accountsCard = (
    <AccountsCard
      accounts={accounts.accounts}
      refreshAccounts={fetchAccounts}
    />
  );
  const schemasCard = (
    <StatementSchemasCard
      statementSchemas={schemas.schemas}
      refreshStatementSchemas={fetchSchemas}
    />
  );

  return (
    <div>
      <div>
        <span onClick={() => setTab(Tab.Budget)}>💰 Budget</span>
        {" | "}
        <span onClick={() => setTab(Tab.Expenses)}>Expenses</span>
        {" | "}
        <span onClick={() => setTab(Tab.Accounts)}>Accounts</span>
        {" | "}
        <span onClick={() => setTab(Tab.Schemas)}>Schemas</span>
      </div>
      {render_if(tab == Tab.Budget, budgetCard)}
      {render_if(tab == Tab.Expenses, expensesCard)}
      {render_if(tab == Tab.Accounts, accountsCard)}
      {render_if(tab == Tab.Schemas, schemasCard)}
    </div>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
