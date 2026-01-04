import React from "react";

import { ExpenseView } from "./ExpenseView";

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
    <table>
      <thead>
        <tr>
          <td>Account</td>
          <td>Total</td>
        </tr>
      </thead>
      <tbody>
        {Array.from(sumByAccount.keys())
          .toSorted()
          .map((accountName) => (
            <tr key={accountName}>
              <td>{accountName}</td>
              <td>{sumByAccount.get(accountName)!.toFixed(2)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
