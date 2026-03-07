import React from "react";

import { ExpenseView } from "./ExpenseView";

import * as UI from "./ui/Common";

export function ExpensesPivotTable({
  expenses,
}: {
  expenses: Array<ExpenseView>;
}) {
  const sumByAccount = new Map<string, number>();

  for (const expense of expenses) {
    const key = expense.account.name;
    const newTotal = expense.amount + (sumByAccount.get(key) ?? 0);
    sumByAccount.set(key, newTotal);
  }

  return (
    <UI.Table striped>
      <thead>
        <tr>
          <td>Account</td>
          <td className="r-align">Total</td>
        </tr>
      </thead>
      <tbody>
        {Array.from(sumByAccount.keys())
          .toSorted()
          .map((accountName) => (
            <tr key={accountName}>
              <td>{accountName}</td>
              <UI.CurrencyCell
                value={sumByAccount.get(accountName) || 0}
                softNegatives={false}
              />
            </tr>
          ))}
      </tbody>
    </UI.Table>
  );
}
