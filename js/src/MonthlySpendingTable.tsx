import React from "react";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";
import { MonthlySpendingData } from "./MonthlySpendingData";
import { ExpensesQuery } from "./ExpensesList";
import { Col, SmallInlineGlyph } from "./ui/Common";

function getMonths(year: number): Array<string> {
  return [...Array(12).keys()].map((m) => {
    const month = String(m + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

function SpendingTableColgroup() {
  // 13 -> 12 months + total
  return (
    <colgroup>
      <Col />
      {Array(13).map((month) => (
        <Col key={month} widthPct={6} />
      ))}
    </colgroup>
  );
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
  const classNames = ["number", "r-align"];

  if (spend <= 0) {
    classNames.push("soft");
  } else if (obj !== null && spend > obj.amountPerMonth) {
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

function SpendingTableHeaderRow({
  year,
  updateExpensesQuery,
}: {
  year: number;
  updateExpensesQuery: (ExpensesQuery) => void;
}) {
  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const onClick = () => {
      updateExpensesQuery({
        variant: "period",
        period: month,
        categorySelector: "all-not-ignored",
      } as ExpensesQuery);
    };
    const cell = (
      <th key={month} className="r-align nowrap td-button" onClick={onClick}>
        {month}
      </th>
    );
    cells.push(cell);
  }

  return (
    <tr>
      <th>Name</th>
      {cells}
      <th className="r-align">TOTAL</th>
    </tr>
  );
}

function SpendingTableFooterRow({
  year,
  data,
  updateExpensesQuery,
}: {
  year: number;
  data: MonthlySpendingData;
  updateExpensesQuery: (ExpensesQuery) => void;
}) {
  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const onClick = () => {
      updateExpensesQuery({
        variant: "period",
        period: month,
        categorySelector: "all-not-ignored",
      } as ExpensesQuery);
    };
    const cell = (
      <SpendingTableCell
        key={month}
        obj={null}
        spend={data.getMonthTotal(month)}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  return (
    <tr>
      <th>TOTAL</th>
      {cells}
      <SpendingTableCell
        key="__total"
        obj={null}
        spend={data.getTotalSpend()}
      />
    </tr>
  );
}

function SpendingTableUncategorizedRow({
  year,
  data,
  updateExpensesQuery,
}: {
  year: number;
  data: MonthlySpendingData;
  updateExpensesQuery: (ExpensesQuery) => void;
}) {
  const headerCellOnClick = () => {
    updateExpensesQuery({
      variant: "period",
      period: year.toString(),
      categorySelector: "uncategorized",
    } as ExpensesQuery);
  };
  const headerCell = (
    <td className="td-button" onClick={headerCellOnClick}>
      <i>uncategorized</i>
    </td>
  );

  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const spend = data.getUncategorizedSpend(month);
    const onClick = () => {
      updateExpensesQuery({
        variant: "period",
        period: month,
        categorySelector: "uncategorized",
      } as ExpensesQuery);
    };
    const cell = (
      <SpendingTableCell
        key={month}
        obj={null}
        spend={spend}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  const totalCell = (
    <SpendingTableCell
      key="__total"
      obj={null}
      spend={data.getUncategorizedTotal()}
      onClick={headerCellOnClick}
    />
  );

  return (
    <tr className="bold highlight">
      {headerCell}
      {cells}
      {totalCell}
    </tr>
  );
}

function SpendingTableRow({
  obj,
  year,
  data,
  updateExpensesQuery,
}: {
  obj: BudgetItemView | BudgetCategoryView;
  year: number;
  data: MonthlySpendingData;
  updateExpensesQuery: (ExpensesQuery) => void;
}) {
  const isCategory = obj instanceof BudgetCategoryView;

  const headerCellOnClick = () => {
    updateExpensesQuery({
      variant: "period",
      period: year.toString(),
      categorySelector: obj,
    } as ExpensesQuery);
  };
  const headerCell = (
    <td className="v-center td-button" onClick={headerCellOnClick}>
      {!isCategory && <SmallInlineGlyph glyph="chevron_right" />}
      {obj.name}
    </td>
  );

  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const spend = isCategory
      ? data.getCategorySpend(obj.id, month)
      : data.getItemSpend(obj.id, month);
    const onClick = () => {
      updateExpensesQuery({
        variant: "period",
        period: month,
        categorySelector: obj,
      } as ExpensesQuery);
    };
    const cell = (
      <SpendingTableCell
        key={month}
        obj={obj}
        spend={spend}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  const totalCell = (
    <SpendingTableCell
      key="__total"
      obj={null}
      spend={
        isCategory ? data.getCategoryTotal(obj.id) : data.getItemTotal(obj.id)
      }
      onClick={headerCellOnClick}
    />
  );

  return (
    <tr className={isCategory ? "bold highlight" : ""}>
      {headerCell}
      {cells}
      {totalCell}
    </tr>
  );
}

export function MonthlySpendingTable({
  data,
  budget,
  updateExpensesQuery,
}: {
  data: MonthlySpendingData;
  budget: BudgetView;
  updateExpensesQuery: (ExpensesQuery) => void;
}) {
  const year = budget.year;

  const rows: Array<React.ReactNode> = [];
  for (const category of budget.categories) {
    rows.push(
      <SpendingTableRow
        key={`${category.id}`}
        obj={category}
        year={year}
        data={data}
        updateExpensesQuery={updateExpensesQuery}
      />,
    );

    for (const item of category.items) {
      rows.push(
        <SpendingTableRow
          key={`${category.id}-${item.id}`}
          obj={item}
          year={year}
          data={data}
          updateExpensesQuery={updateExpensesQuery}
        />,
      );
    }
  }

  return (
    <table>
      <SpendingTableColgroup />

      <thead>
        <SpendingTableHeaderRow
          year={year}
          updateExpensesQuery={updateExpensesQuery}
        />
      </thead>

      <tbody>
        {rows}
        <SpendingTableUncategorizedRow
          year={year}
          data={data}
          updateExpensesQuery={updateExpensesQuery}
        />
      </tbody>

      <tfoot>
        <SpendingTableFooterRow
          year={year}
          data={data}
          updateExpensesQuery={updateExpensesQuery}
        />
      </tfoot>
    </table>
  );
}
