// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { ExpenseFields } from "./Expense";
import type { StatementSchemaFields } from "./StatementSchema";

export type TestSchemaRequest = { schema: StatementSchemaFields, row: string, };

export type TestSchemaResponse = { result: TestSchemaResult, error: string | null, expense: ExpenseFields | null, };

export type TestSchemaResult = "Skip" | "Error" | "Success";
