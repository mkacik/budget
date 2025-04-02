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
  category: BudgetCategoryView;
  displayName: string;
  amountPerYear: number;

  constructor(item: BudgetItem, category: BudgetCategoryView) {
    this.item = item;
    this.category = category;
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

  get amountPerMonth() {
    return this.amountPerYear / 12;
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
}

export class BudgetView {
  categories: Array<BudgetCategoryView>;
  ignoredCategories: Array<BudgetCategoryView>;
  categoriesByID: Map<number, BudgetCategoryView>;

  items: Array<BudgetItemView>;
  ignoredItems: Array<BudgetItemView>;
  itemsByID: Map<number, BudgetItemView>;

  budget: Budget;

  constructor(budget: Budget) {
    const categoriesMap = new Map<number, BudgetCategoryView>();
    for (const category of budget.categories) {
      const categoryView = new BudgetCategoryView(category);
      categoriesMap.set(categoryView.id, categoryView);
    }

    const itemsMap = new Map<number, BudgetItemView>();
    for (const item of budget.items) {
      const categoryId = item.category_id;
      const category = categoriesMap.get(categoryId)!;
      const itemView = new BudgetItemView(item, category);
      itemsMap.set(itemView.id, itemView);
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

    this.budget = budget;
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
      throw new Error(
        `Something fucky happened - can't find budget item with id: ${itemID}`,
      );
    }
    return item;
  }

  getCategory(categoryID: number): BudgetCategoryView {
    const category = this.categoriesByID.get(categoryID);
    if (category === null || category === undefined) {
      throw new Error(
        `Something fucky happened - can't find budget category with id: ${categoryID}`,
      );
    }
    return category;
  }
}
