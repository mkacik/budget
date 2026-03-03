import {
  Budget,
  BudgetAllowance,
  BudgetCategory,
  BudgetItem,
} from "./types/Budget";

export function getAmountPerYear(allowance: BudgetAllowance | null) {
  if (allowance === null) {
    return 0;
  }

  const amount = allowance.amount;
  switch (allowance.variant) {
    case "Weekly":
      return amount * 52;
    case "Monthly":
      return amount * 12;
    case "Yearly":
      return amount;
    default:
      throw Error("Incorrect BudgetAllowance variant!");
  }
}

export class BudgetItemView {
  item: BudgetItem;
  amountPerYear: number;

  constructor(item: BudgetItem) {
    this.item = item;
    this.amountPerYear = getAmountPerYear(item.allowance);
  }

  get id() {
    return this.item.id;
  }

  get allowance() {
    return this.item.allowance;
  }

  get categoryID() {
    return this.item.category_id;
  }

  get fundID() {
    return this.item.fund_id;
  }

  get name() {
    return this.item.name;
  }

  get displayName() {
    return this.item.display_name;
  }

  get ignored() {
    return this.item.ignored;
  }

  get amountPerMonth() {
    return this.amountPerYear / 12;
  }

  get isBudgetOnly() {
    return this.item.budget_only;
  }

  get isCategorizationOnly() {
    return this.item.allowance === null && !this.item.ignored;
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

  get amountPerMonth() {
    return this.amountPerYear / 12;
  }

  get displayName() {
    return this.category.name;
  }
}

export class BudgetView {
  categories: Array<BudgetCategoryView>;
  ignoredCategories: Array<BudgetCategoryView>;
  categoriesByID: Map<number, BudgetCategoryView>;

  items: Array<BudgetItemView>;
  ignoredItems: Array<BudgetItemView>;
  itemsByID: Map<number, BudgetItemView>;

  hasFunds: boolean;

  budget: Budget;

  constructor(budget: Budget) {
    const categoriesMap = new Map<number, BudgetCategoryView>();
    for (const category of budget.categories) {
      const categoryView = new BudgetCategoryView(category);
      categoriesMap.set(categoryView.id, categoryView);
    }

    const itemsMap = new Map<number, BudgetItemView>();
    let hasFunds = false;
    for (const item of budget.items) {
      const itemView = new BudgetItemView(item);
      itemsMap.set(itemView.id, itemView);
      if (itemView.fundID) {
        hasFunds = true;
      }

      const category = categoriesMap.get(itemView.categoryID)!;
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
    this.categoriesByID = categoriesMap;

    this.items = this.categories.map((category) => category.items).flat();
    this.ignoredItems = this.ignoredCategories
      .map((category) => category.items)
      .flat();
    this.itemsByID = itemsMap;

    this.hasFunds = hasFunds;

    this.budget = budget;
  }

  get year() {
    return this.budget.year;
  }

  get amountPerYear() {
    return this.categories.reduce(
      (acc, current) => acc + current.amountPerYear,
      0,
    );
  }

  getItem(itemID: number): BudgetItemView {
    const item = this.itemsByID.get(itemID);
    if (item === null || item === undefined) {
      throw Error(
        `Something fucky happened - can't find budget item with id: ${itemID}`,
      );
    }
    return item;
  }

  getCategory(categoryID: number): BudgetCategoryView {
    const category = this.categoriesByID.get(categoryID);
    if (category === null || category === undefined) {
      throw Error(
        `Something fucky happened - can't find budget category with id: ${categoryID}`,
      );
    }
    return category;
  }
}
