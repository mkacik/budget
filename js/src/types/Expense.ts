// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

export type Expense = { id: number, account_id: number, transaction_date: string, transaction_time: string | null, description: string, amount: number, budget_item_id: number | null, };

export type Expenses = { expenses: Array<Expense>, };
