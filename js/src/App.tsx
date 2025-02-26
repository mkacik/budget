import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Accounts } from "./types/Account";
import { Budget } from "./types/Budget";

import { BudgetCard } from "./BudgetCard";
import { BudgetView } from "./BudgetView";
import { AccountsCard } from "./AccountsCard";
import { ExpensesCard } from "./ExpensesCard";

enum Tab {
  Budget,
  Accounts,
  Expenses,
}

function render_if(condition: boolean, element: React.ReactNode) {
  return condition ? element : null;
}

function App() {
  const [budget, setBudget] = useState<BudgetView | null>(null);
  const [accounts, setAccounts] = useState<Accounts | null>(null);

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

  if (budget === null || accounts === null) {
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

  return (
    <div>
      <div>
        <span onClick={() => setTab(Tab.Budget)}>💰 Budget</span>
        {" | "}
        <span onClick={() => setTab(Tab.Expenses)}>Expenses</span>
        {" | "}
        <span onClick={() => setTab(Tab.Accounts)}>Accounts</span>
      </div>
      {render_if(tab == Tab.Budget, budgetCard)}
      {render_if(tab == Tab.Expenses, expensesCard)}
      {render_if(tab == Tab.Accounts, accountsCard)}
    </div>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
