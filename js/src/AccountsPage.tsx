import React from "react";

import { Account } from "./types/Account";
import { StatementSchema } from "./types/StatementSchema";

import { AccountsCard } from "./AccountsCard";
import { StatementSchemasCard } from "./StatementSchemasCard";
import { Section } from "./ui/Common";

export function AccountsPage({
  accounts,
  refreshAccounts,
  schemas,
  refreshSchemas,
}: {
  accounts: Array<Account>;
  refreshAccounts: () => void;
  schemas: Array<StatementSchema>;
  refreshSchemas: () => void;
}) {
  return (
    <>
      <Section>
        <AccountsCard
          accounts={accounts}
          refreshAccounts={refreshAccounts}
          schemas={schemas}
        />
      </Section>
      <Section>
        <StatementSchemasCard
          schemas={schemas}
          refreshSchemas={refreshSchemas}
        />
      </Section>
    </>
  );
}
