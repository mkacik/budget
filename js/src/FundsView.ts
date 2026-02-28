import { BudgetFund } from "./types/Fund";
import { BudgetItemWithSpend } from "./types/Budget";

import { getAmountPerYear } from "./BudgetView";

function cmp(a: BudgetItemWithSpend, b: BudgetItemWithSpend) {
  return b.year - a.year;
}

interface FundWithSpend extends BudgetFund {
  amount: number;
  spend: number;
}

export class FundsView {
  funds: Array<FundWithSpend>;
  itemsByFundID: Map<number, Array<BudgetItemWithSpend>>;

  constructor(funds: Array<BudgetFund>, items: Array<BudgetItemWithSpend>) {
    const itemsMap: Map<number, Array<BudgetItemWithSpend>> = new Map();
    for (const item of items) {
      const fundID = item.fund_id!;
      if (!itemsMap.has(fundID)) {
        itemsMap.set(fundID, []);
      }
      itemsMap.get(fundID)!.push(item);
    }

    // Sort by year in descending order
    for (const fundItems of itemsMap.values()) {
      fundItems.sort(cmp);
    }

    const fundsWithSpend: Array<FundWithSpend> = [];
    for (const fund of funds) {
      const fundItems = itemsMap.get(fund.id) ?? [];
      const amount = fundItems.reduce(
        (acc, item) => acc + getAmountPerYear(item.amount),
        0,
      );
      const spend = fundItems.reduce((acc, item) => acc + item.spend, 0);
      const fundWithSpend = {
        ...fund,
        amount: amount,
        spend: spend,
      } as FundWithSpend;
      fundsWithSpend.push(fundWithSpend);
    }

    this.itemsByFundID = itemsMap;
    this.funds = fundsWithSpend;
  }

  getItems(id: number): Array<BudgetItemWithSpend> {
    return this.itemsByFundID.get(id) ?? [];
  }
}
