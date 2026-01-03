import { createContext, useContext } from "react";

import { Account, Accounts } from "./types/Account";
import { StatementSchema, StatementSchemas } from "./types/StatementSchema";

export interface AccountView extends Account {
  statementSchema: StatementSchema | null;
}

export class AccountsView {
  accounts: Array<AccountView>;
  accountsByID: Map<number, AccountView>;

  // schemasByID: Map<number, StatementSchema>;

  constructor(accounts: Accounts, schemas: StatementSchemas) {
    const schemasMap = new Map<number, StatementSchema>();
    for (const schema of schemas.schemas) {
      schemasMap.set(schema.id, schema);
    }

    const accountsMap = new Map<number, AccountView>();
    for (const account of accounts.accounts) {
      let schema: null | StatementSchema = null;

      const schema_id = account.statement_schema_id;
      if (schema_id !== null) {
        const maybeSchema = schemasMap.get(schema_id);
        if (maybeSchema === undefined) {
          throw new Error("Account has bad schema attached!");
        }
        schema = maybeSchema;
      }

      const accountView = {
        ...account,
        statementSchema: schema,
      } as AccountView;
      accountsMap.set(accountView.id, accountView);
    }

    const collator = new Intl.Collator("en", { sensitivity: "base" });
    const cmp = (a: AccountView, b: AccountView) => {
      return collator.compare(a.name, b.name);
    };

    this.accountsByID = accountsMap;
    this.accounts = Array.from(accountsMap.values()).toSorted(cmp);
  }

  firstOrNull(): AccountView | null {
    return this.accounts[0] || null;
  }

  hasAccount(accountID: number): boolean {
    return this.accountsByID.get(accountID) !== undefined;
  }

  getAccount(accountID: number): AccountView {
    const account = this.accountsByID.get(accountID);
    if (account === null || account === undefined) {
      throw new Error(
        `Something fucky happened - can't find account with id: ${accountID}`,
      );
    }
    return account;
  }
}

export const AccountsViewContext = createContext<AccountsView | null>(null);

export const useAccountsViewContext = (): AccountsView => {
  const accountsView = useContext(AccountsViewContext);
  if (accountsView === null) {
    throw new Error("AccountsViewContext requested but not provided");
  }
  return accountsView;
};
