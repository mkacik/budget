import {
  Budget,
  BudgetAmount,
  BudgetCategory,
  BudgetItem,
} from "./types/Budget";

function getAmountPerYear(amount: BudgetAmount | null): number {
  if (amount === null) {
    return 0;
  }

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
      throw Error("Incorrect BudgetAmount enum value!");
  }
}

export class BudgetItemView {
  item: BudgetItem;
  displayName: string;
  amountPerYear: number;

  constructor(item: BudgetItem, category: BudgetCategory) {
    this.item = item;
    this.displayName = `${category.name} :: ${item.name}`;
    this.amountPerYear = getAmountPerYear(item.amount);
  }

  get id() {
    return this.item.id;
  }

  get categoryId() {
    return this.item.category_id;
  }

  get name() {
    return this.item.name;
  }
}

export class BudgetCategoryView {
  category: BudgetCategory;
  items: Array<BudgetItemView>;
  private _amountPerYear: number | null;

  constructor(category: BudgetCategory) {
    this.category = category;
    this.items = new Array<BudgetItemView>();
    this._amountPerYear = null;
  }

  get id() {
    return this.category.id;
  }

  get name() {
    return this.category.name;
  }

  get ignored() {
    return this.category.ignored;
  }

  get amountPerYear() {
    if (this._amountPerYear === null) {
      this._amountPerYear = this.items.reduce(
        (acc, current) => acc + current.amountPerYear,
        0,
      );
    }
    return this._amountPerYear;
  }
}

export class BudgetView {
  categories: Array<BudgetCategoryView>;
  ignoredCategories: Array<BudgetCategoryView>;
  budget: Budget;

  constructor(budget: Budget) {
    const categoriesMap = new Map<number, BudgetCategoryView>();
    for (const category of budget.categories) {
      const categoryView = new BudgetCategoryView(category);
      categoriesMap.set(categoryView.id, categoryView);
    }

    for (const item of budget.items) {
      const categoryId = item.category_id;
      const category = categoriesMap.get(categoryId)!;
      const itemView = new BudgetItemView(item, category.category);
      category.items.push(itemView);
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

    this.categories = categories.filter((category) => !category.ignored);
    this.ignoredCategories = categories.filter((category) => category.ignored);
    this.budget = budget;
  }

  get amountPerYear() {
    return this.categories.reduce(
      (acc, current) => acc + current.amountPerYear,
      0,
    );
  }

  getBudgetItemsForCategorization(): BudgetItemDB {
    const items = new Array<BudgetItemView>();
    for (const list of [this.categories, this.ignoredCategories]) {
      for (const category of list) {
        for (const item of category.items) {
          items.push(item);
        }
      }
    }
    return new BudgetItemDB(items);
  }
}

export class BudgetItemDB {
  items: Array<BudgetItemView>;
  itemsByID: Map<number, BudgetItemView>;

  constructor(items: Array<BudgetItemView>) {
    this.items = items;
    this.itemsByID = new Map(items.map((item) => [item.id, item]));
  }

  get(budgetItemID: number): BudgetItemView {
    const item = this.itemsByID.get(budgetItemID);
    if (item === null || item === undefined) {
      throw new Error(
        `Something fucky happened in db - can't find budget item id: ${budgetItemID}`,
      );
    }
    return item;
  }
}
