import { Account, Accounts } from "./types/Account";
import { StatementSchema, StatementSchemas } from "./types/StatementSchema";

export class AccountView {
  account: Account;
  statementSchema: StatementSchema | null;

  constructor(account: Account, statementSchema: StatementSchema | null) {
    this.account = account;
    this.statementSchema = statementSchema;
  }

  get id() {
    return this.account.id;
  }

  get name() {
    return this.account.name;
  }

  get accountClass() {
    return this.account.class;
  }
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

      const accountView = new AccountView(account, schema);
      accountsMap.set(accountView.id, accountView);
    }

    const collator = new Intl.Collator("en", { sensitivity: "base" });
    const cmp = (a: AccountView, b: AccountView) => {
      return collator.compare(a.name, b.name);
    };

    this.accountsByID = accountsMap;
    this.accounts = Array.from(accountsMap.values()).toSorted(cmp);
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
