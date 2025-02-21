import { Budget } from "./types/Budget";
import { BudgetAmount } from "./types/BudgetAmount";
import { BudgetCategory } from "./types/BudgetCategory";
import { BudgetItem } from "./types/BudgetItem";

function amount_per_year_from_budget_amount(amount: BudgetAmount): number {
  const props = Object.keys(amount);
  if (props.length !== 1) {
    throw Error("Incorrect BudgetAmount enum value!");
  }
  const enumKey = props[0];
  const enumProps = amount[enumKey];

  switch (enumKey) {
    case "Weekly":
      return enumProps.amount! * 52;
    case "Monthly":
      return enumProps.amount! * 12;
    case "Yearly":
      return enumProps.amount! * 1;
    case "EveryXYears":
      return enumProps.amount! / enumProps.x!;
    default:
      return 0;
  }
}

export class BudgetItemView {
  item: BudgetItem;
  amount_per_year: number;

  constructor(item: BudgetItem) {
    this.item = item;
    this.amount_per_year = amount_per_year_from_budget_amount(item.amount);
  }

  get id() {
    return this.item.id!;
  }

  get categoryId() {
    return this.item.category_id!;
  }

  get name() {
    return this.item.name!;
  }
}

export class BudgetCategoryView {
  category: BudgetCategory;
  items: Array<BudgetItemView>;
  private _amount_per_year: number | null;

  constructor(category: BudgetCategory) {
    this.category = category;
    this.items = new Array<BudgetItemView>();
    this._amount_per_year = null;
  }

  get id() {
    return this.category.id!;
  }

  get name() {
    return this.category.name!;
  }

  get amount_per_year() {
    if (this._amount_per_year === null) {
      this._amount_per_year = this.items.reduce(
        (acc, current) => acc + current.amount_per_year,
        0,
      );
    }
    return this._amount_per_year;
  }
}

export class BudgetView {
  categories: Array<BudgetCategoryView>;
  budget: Budget;

  constructor(budget: Budget) {
    const categoriesMap = new Map<number, BudgetCategoryView>();
    for (const category of budget.categories) {
      const categoryView = new BudgetCategoryView(category);
      categoriesMap.set(categoryView.id, categoryView);
    }

    for (const item of budget.items) {
      const categoryId = item.category_id!;
      const itemView = new BudgetItemView(item);
      categoriesMap.get(categoryId)!.items.push(itemView);
    }

    const sorter = (a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    };

    const categories = Array.from(categoriesMap.values());
    categories.sort(sorter);
    for (const category of categories) {
      category.items.sort(sorter);
    }

    this.categories = categories;
    this.budget = budget;
  }

  get amount_per_year() {
    return this.categories.reduce(
      (acc, current) => acc + current.amount_per_year,
      0,
    );
  }
}
