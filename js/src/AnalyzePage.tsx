import React from "react";
import { useState, useEffect } from "react";
import { SpendingDataPoint } from "./types/SpendingData";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";
import { MonthlySpendingData } from "./MonthlySpendingData";
import { ExpensesQuery, ExpensesList } from "./ExpensesList";
import {
  Col,
  SmallInlineGlyph,
  ErrorCard,
  Section,
  SectionHeader,
  LoadingBanner,
} from "./ui/Common";

function getMonths(year: number): Array<string> {
  return [...Array(12).keys()].map((m) => {
    const month = String(m + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

function SpendingTableCell({
  obj,
  spend,
  onClick,
}: {
  obj: BudgetItemView | BudgetCategoryView | null;
  spend: number;
  onClick?: () => void;
}) {
  const amountPerMonth = obj === null ? 0 : obj.amountPerMonth;
  const classNames = ["number", "r-align"];
  if (spend <= 0) {
    classNames.push("soft");
  } else if (spend > amountPerMonth) {
    classNames.push("red");
  }

  if (onClick !== undefined) {
    classNames.push("td-button");
  }

  return (
    <td className={classNames.join(" ")} onClick={onClick}>
      {spend.toFixed(2)}
    </td>
  );
}

function MonthlySpendingTable({
  data,
  budget,
  updateExpensesQuery,
}: {
  data: MonthlySpendingData;
  budget: BudgetView;
  updateExpensesQuery: (ExpensesQuery) => void;
}) {
  const months = getMonths(2025);

  const headerRow = months.map((month, idx) => {
    const onClick = () => {
      updateExpensesQuery({
        variant: "period",
        period: month,
        categorySelector: "all",
      } as ExpensesQuery);
    };
    return (
      <th className="r-align nowrap td-button" key={idx} onClick={onClick}>
        {month}
      </th>
    );
  });

  const rows: Array<React.ReactNode> = [];
  for (const category of budget.categories) {
    const cols: Array<React.ReactNode> = [<td key="hdr">{category.name}</td>];

    for (const month of months) {
      const spend = data.getCategorySpend(category.id, month);
      const onClick = () => {
        updateExpensesQuery({
          variant: "period",
          period: month,
          categorySelector: category,
        } as ExpensesQuery);
      };
      const cell = (
        <SpendingTableCell
          key={month}
          obj={category}
          spend={spend}
          onClick={onClick}
        />
      );
      cols.push(cell);
    }

    rows.push(
      <tr key={`${category.id}`} className="bold highlight">
        {cols}
      </tr>,
    );

    for (const item of category.items) {
      const cols: Array<React.ReactNode> = [
        <td key="hdr" className="v-center">
          <SmallInlineGlyph glyph="chevron_right" />
          {item.name}
        </td>,
      ];

      for (const month of months) {
        const spend = data.getItemSpend(item.id, month);
        const onClick = () => {
          updateExpensesQuery({
            variant: "period",
            period: month,
            categorySelector: item,
          } as ExpensesQuery);
        };
        const cell = (
          <SpendingTableCell
            key={month}
            obj={item}
            spend={spend}
            onClick={onClick}
          />
        );
        cols.push(cell);
      }

      rows.push(<tr key={`${category.id}-${item.id}`}>{cols}</tr>);
    }
  }

  const colsUncategorized: Array<React.ReactNode> = [
    <td key="hdr">
      <i>uncategorized</i>
    </td>,
  ];
  for (const month of months) {
    const spend = data.getUncategorizedSpend(month);
    const onClick = () => {
      updateExpensesQuery({
        variant: "period",
        period: month,
        categorySelector: null,
      } as ExpensesQuery);
    };
    colsUncategorized.push(
      <SpendingTableCell
        key={month}
        obj={null}
        spend={spend}
        onClick={onClick}
      />,
    );
  }
  rows.push(
    <tr key={"__uncategorized"} className="bold highlight">
      {colsUncategorized}
    </tr>,
  );

  return (
    <table>
      <colgroup>
        <Col />
        {months.map((month) => (
          <Col key={month} widthPct={7} />
        ))}
      </colgroup>

      <thead>
        <tr>
          <th>Name</th>
          {headerRow}
        </tr>
      </thead>

      <tbody>{rows}</tbody>
    </table>
  );
}

function getExpensesSectionHeaderTitle(query: ExpensesQuery): React.ReactNode {
  switch (query.variant) {
    case "period": {
      const categorySelector = query.categorySelector;
      if (categorySelector === null) {
        return (
          <>
            [{query.period}] <i>uncategorized</i>
          </>
        );
      } else if (categorySelector === "all") {
        return (
          <>
            [{query.period}] <i>all (non-ignored)</i>
          </>
        );
      } else if ("displayName" in categorySelector) {
        return `[${query.period}] ${categorySelector.displayName}`;
      }
      throw new Error("malformed expenses query!");
    }
    default:
      throw new Error("malformed expenses query!");
  }
}

function ExpensesSection({
  query,
  onExpenseCategoryChange,
}: {
  query: ExpensesQuery | null;
  onExpenseCategoryChange: () => void;
}) {
  if (query === null || query.variant !== "period") {
    return null;
  }

  return (
    <Section>
      <SectionHeader>{getExpensesSectionHeaderTitle(query)}</SectionHeader>
      <ExpensesList
        query={query}
        onExpenseCategoryChange={onExpenseCategoryChange}
      />
    </Section>
  );
}

export function AnalyzePage({ budget }: { budget: BudgetView }) {
  const [spendingData, setSpendingData] = useState<MonthlySpendingData | null>(
    null,
  );
  const [expensesQuery, setExpensesQuery] = useState<ExpensesQuery | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpendingData = () => {
    setError(null);
    setLoading(true);
    fetch("/api/spending")
      .then((response) => response.json())
      .then((result) => {
        const dataPoints = result.data as Array<SpendingDataPoint>;
        const data = new MonthlySpendingData(dataPoints, budget);
        setSpendingData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
        setError("Something went wrong! Please refresh the page");
      });
  };

  useEffect(() => {
    if (spendingData === null && error === null) {
      fetchSpendingData();
    }
  }, []);

  const spendingTable =
    spendingData !== null ? (
      <MonthlySpendingTable
        data={spendingData}
        budget={budget}
        updateExpensesQuery={(query) => setExpensesQuery(query)}
      />
    ) : null;

  return (
    <>
      <Section>
        <SectionHeader>Analyze spending</SectionHeader>
        <ErrorCard message={error} />
        {spendingTable}
      </Section>
      <ExpensesSection
        query={expensesQuery}
        onExpenseCategoryChange={fetchSpendingData}
      />
      <LoadingBanner isLoading={loading} />
    </>
  );
}
