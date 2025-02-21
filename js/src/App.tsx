import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Accounts } from "./types/Accounts";
import { Budget } from "./types/Budget";

import { BudgetCard } from "./BudgetCard";
import { BudgetView } from "./BudgetView";
import { ExpensesCard } from "./ExpensesCard";

enum Tab {
  Budget,
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

  useEffect(() => {
    if (accounts === null) {
      fetch("/api/accounts")
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          setAccounts(result as Accounts);
        });
    }
  }, [accounts, setAccounts]);

  const budgetCard = budget !== null ? <BudgetCard budget={budget} /> : null;
  const expensesCard =
    accounts !== null ? <ExpensesCard allAccounts={accounts} /> : null;
  return (
    <div>
      <div>
        <span onClick={() => setTab(Tab.Budget)}>💰 Budget</span>
        {" | "}
        <span onClick={() => setTab(Tab.Expenses)}>Expenses</span>
      </div>
      {render_if(tab == Tab.Budget, budgetCard)}
      {render_if(tab == Tab.Expenses, expensesCard)}
    </div>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
