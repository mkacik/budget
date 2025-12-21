import { createContext, useContext } from "react";

import { BudgetView } from "./BudgetView";

export const BudgetViewContext = createContext<BudgetView | null>(null);

export const useBudgetViewContext = (): BudgetView => {
  const budgetView = useContext(BudgetViewContext);
  if (budgetView === null) {
    throw new Error("BugetViewContext requested but not provided.");
  }
  return budgetView;
};
