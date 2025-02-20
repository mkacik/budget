import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Budget } from "./types/Budget";
import { BudgetCard } from "./BudgetCard";
import { BudgetView } from "./BudgetView";

function App() {
  const [budget, setBudget] = useState<BudgetView | null>(null);

  useEffect(() => {
    if (budget === null) {
      fetch("/api/budget")
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          let budget = new BudgetView(result as Budget);
          setBudget(budget);
        });
    }
  }, [budget, setBudget]);

  const budgetCard = budget !== null ? <BudgetCard budget={budget} /> : null;
  return (
    <div>
      <div>💰 Budget</div>
      {budgetCard}
    </div>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
