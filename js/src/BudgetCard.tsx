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

  const closeModal = () => {
    setModalMode(ModalMode.HIDDEN);
  };

  let modalContent: React.ReactNode = null;
  switch (modalMode) {
    case ModalMode.CATEGORY: {
      modalContent = (
        <BudgetCategoryForm
          key={editedCategory?.name}
          budgetCategory={editedCategory?.category ?? null}
          hideEditForm={closeModal}
          refreshBudget={refreshBudget}
        />
      );
      break;
    }
    case ModalMode.ITEM: {
      modalContent = (
        <BudgetItemForm
          key={editedItem?.name}
          budgetItem={editedItem?.item ?? null}
          hideEditForm={closeModal}
          refreshBudget={refreshBudget}
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

  return (
    <div>
      <div>Total - {budget.amountPerYear}</div>
      <div>
        {budget.categories.map((category, index) => (
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
        <span onClick={() => editCategory(null)}>[add new category]</span>
      </div>

      <div>{maybeAddNewItemButton}</div>

      <ModalCard visible={modalMode != ModalMode.HIDDEN}>
        {modalContent}
      </ModalCard>
    </div>
  );
}
