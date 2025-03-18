import React from "react";
import { useState } from "react";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";

import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { BudgetItemForm } from "./BudgetItemForm";
import { ModalCard } from "./ui/Common";

function BudgetItemCard({
  item,
  editItem,
}: {
  item: BudgetItemView;
  editItem: () => void;
}) {
  return (
    <div>
      {item.name} - {item.amountPerYear}
      <span onClick={editItem}>[edit]</span>
    </div>
  );
}

function BudgetCategoryCard({
  category,
  editCategory,
  children,
}: {
  category: BudgetCategoryView;
  editCategory: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div>
        <b>
          {category.name} - {category.amountPerYear}
        </b>
        <span onClick={editCategory}>[edit]</span>
      </div>
      {children}
    </div>
  );
}

enum ModalMode {
  CATEGORY,
  ITEM,
  HIDDEN,
}

export function BudgetCard({
  budget,
  refreshBudget,
}: {
  budget: BudgetView;
  refreshBudget: () => void;
}) {
  // Note: need this enum, because null value of edited object could represent either new item
  // or new category;
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.HIDDEN);
  const [editedCategory, setEditedCategory] =
    useState<BudgetCategoryView | null>(null);
  const [editedItem, setEditedItem] = useState<BudgetItemView | null>(null);

  const editCategory = (category: BudgetCategoryView | null) => {
    setEditedCategory(category);
    setModalMode(ModalMode.CATEGORY);
  };

  const editItem = (item: BudgetItemView | null) => {
    setEditedItem(item);
    setModalMode(ModalMode.ITEM);
  };

  const onEditSuccess = () => {
    refreshBudget();
    setModalMode(ModalMode.HIDDEN);
  };

  let modalContent: React.ReactNode = null;
  switch (modalMode) {
    case ModalMode.CATEGORY: {
      modalContent = (
        <BudgetCategoryForm
          key={editedCategory?.name}
          budgetCategory={editedCategory?.category ?? null}
          onSuccess={onEditSuccess}
        />
      );
      break;
    }
    case ModalMode.ITEM: {
      modalContent = (
        <BudgetItemForm
          key={editedItem?.name}
          budgetItem={editedItem?.item ?? null}
          onSuccess={onEditSuccess}
          allCategories={budget.categories}
        />
      );
      break;
    }
    default:
      break;
  }

  const maybeAddNewItemButton =
    budget.categories.length > 0 ? (
      <span onClick={() => editItem(null)}>[add new item]</span>
    ) : null;

  const includedCategories = budget.categories.filter(
    (category) => !category.ignored,
  );
  const excludedCategories = budget.categories.filter(
    (category) => category.ignored,
  );

  return (
    <div>
      <h2>Budget</h2>
      <div>
        {includedCategories.map((category, index) => (
          <BudgetCategoryCard
            key={index}
            editCategory={() => editCategory(category)}
            category={category}
          >
            {category.items.map((item, index) => (
              <BudgetItemCard
                key={index}
                item={item}
                editItem={() => editItem(item)}
              />
            ))}
          </BudgetCategoryCard>
        ))}
      </div>
      <div>
        <b>TOTAL - {budget.amountPerYear}</b>
      </div>

      <div>
        <span onClick={() => editCategory(null)}>[add new category]</span>
        {maybeAddNewItemButton}
      </div>

      <h2>Ignored categories</h2>

      <div>
        {excludedCategories.map((category, index) => (
          <BudgetCategoryCard
            key={index}
            editCategory={() => editCategory(category)}
            category={category}
          >
            {category.items.map((item, index) => (
              <BudgetItemCard
                key={index}
                item={item}
                editItem={() => editItem(item)}
              />
            ))}
          </BudgetCategoryCard>
        ))}
      </div>

      <ModalCard
        visible={modalMode !== ModalMode.HIDDEN}
        hideModal={() => setModalMode(ModalMode.HIDDEN)}
      >
        {modalContent}
      </ModalCard>
    </div>
  );
}
