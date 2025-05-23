// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

export type Account = { id: number, name: string, class: AccountClass, statement_schema_id: number | null, };

export type AccountClass = "Bank" | "CreditCard" | "Shop";

export type AccountFields = { name: string, class: AccountClass, statement_schema_id: number | null, };

export type Accounts = { accounts: Array<Account>, };
