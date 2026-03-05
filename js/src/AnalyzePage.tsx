import React from "react";
import { useState, useEffect } from "react";

import { BudgetFund, ExpensesQuery, SpendingData } from "./generated/types";

import { FundsView } from "./FundsView";
import { BudgetView } from "./BudgetView";
import { MonthlySpendingData } from "./MonthlySpendingData";
import {
  TitledExpensesQuery,
  MonthlySpendingTable,
} from "./MonthlySpendingTable";
import { ExpensesList } from "./ExpensesList";
import { FetchHelper } from "./Common";

import * as UI from "./ui/Common";

export function AnalyzePage({
  budget,
  funds,
}: {
  budget: BudgetView;
  funds: Array<BudgetFund>;
}) {
  const [data, setData] = useState<MonthlySpendingData | null>(null);

  const [expensesQuery, setExpensesQuery] =
    useState<TitledExpensesQuery | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    const fetchHelper = new FetchHelper(setErrorMessage, setLoading);
    fetchHelper.fetch(new Request(`/api/spending/${budget.year}`), (json) => {
      const result = json as SpendingData;
      const fundsView = new FundsView(funds, result.fund_items);
      setData(new MonthlySpendingData(result.data, budget, fundsView));
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <UI.Section title="Analyze spending">
        <UI.ErrorCard message={errorMessage} />
        {data && (
          <MonthlySpendingTable
            data={data}
            budget={budget}
            updateExpensesQuery={setExpensesQuery}
          />
        )}
      </UI.Section>
      {data && expensesQuery && (
        <UI.Section title={expensesQuery.title}>
          <ExpensesList
            query={expensesQuery as ExpensesQuery}
            budget={budget}
            onExpenseCategoryChange={fetchData}
          />
        </UI.Section>
      )}

      <UI.LoadingBanner isLoading={loading} />
    </>
  );
}
