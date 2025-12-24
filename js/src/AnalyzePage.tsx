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
  year,
  data,
  budget,
  updateExpensesQuery,
}: {
  year: number;
  data: MonthlySpendingData | null;
  budget: BudgetView;
  updateExpensesQuery: (ExpensesQuery) => void;
}) {
  if (data === null) {
    return null;
  }

  const months = getMonths(year);

  const headerRow = months.map((month, idx) => {
    const onClick = () => {
      updateExpensesQuery({
        variant: "period",
        period: month,
        categorySelector: "all-not-ignored",
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
        categorySelector: "uncategorized",
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

  return (
    <>
      <Section>
        <SectionHeader>Analyze spending</SectionHeader>
        <ErrorCard message={error} />
        <MonthlySpendingTable
          year={2025}
          data={spendingData}
          budget={budget}
          updateExpensesQuery={(query) => setExpensesQuery(query)}
        />
      </Section>
      <Section>
        <ExpensesSectionHeader query={expensesQuery} />
        {expensesQuery && (
          <ExpensesList
            query={expensesQuery}
            onExpenseCategoryChange={fetchSpendingData}
          />
        )}
      </Section>
      <LoadingBanner isLoading={loading} />
    </>
  );
}
