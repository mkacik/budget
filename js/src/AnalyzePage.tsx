import React from "react";
import { useState, useEffect } from "react";
import { SpendingData } from "./types/SpendingData";

import { BudgetFund } from "./types/Fund";
import { FundsView } from "./FundsView";
import { BudgetView } from "./BudgetView";
import { MonthlySpendingData } from "./MonthlySpendingData";
import { MonthlySpendingTable } from "./MonthlySpendingTable";
import { ExpensesQuery, ExpensesList } from "./ExpensesList";
import { FetchHelper } from "./Common";
import { ErrorCard, Section, SectionHeader, LoadingBanner } from "./ui/Common";

function ExpensesSectionHeader({ query }: { query: ExpensesQuery | null }) {
  if (query === null) {
    return (
      <span className="soft">
        Click on any table cell to select relevant expenses
      </span>
    );
  }

  if (query.variant !== "period") {
    throw new Error("Only period query accepted in this context!");
  }

  const titleParts: Array<React.ReactNode> = [`[${query.period}]`, " "];

  const categorySelector = query.categorySelector;
  if (categorySelector === "uncategorized") {
    titleParts.push(<i key={categorySelector}>uncategorized</i>);
  } else if (categorySelector === "all-not-ignored") {
    titleParts.push(
      <i key={categorySelector}>all (excluding ignored categories)</i>,
    );
  } else if ("displayName" in categorySelector) {
    titleParts.push(categorySelector.displayName);
  }

  return <SectionHeader>{titleParts}</SectionHeader>;
}

export function AnalyzePage({
  budget,
  funds,
}: {
  budget: BudgetView;
  funds: Array<BudgetFund>;
}) {
  const [data, setData] = useState<MonthlySpendingData | null>(null);
  const [expensesQuery, setExpensesQuery] = useState<ExpensesQuery | null>(
    null,
  );

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
      <Section>
        <SectionHeader>Analyze spending</SectionHeader>
        <ErrorCard message={errorMessage} />
        {data && (
          <MonthlySpendingTable
            data={data}
            budget={budget}
            updateExpensesQuery={(query) => setExpensesQuery(query)}
          />
        )}
      </Section>
      <Section>
        <ExpensesSectionHeader query={expensesQuery} />
        {expensesQuery && (
          <ExpensesList
            query={expensesQuery}
            budget={budget}
            onExpenseCategoryChange={fetchData}
          />
        )}
      </Section>
      <LoadingBanner isLoading={loading} />
    </>
  );
}
