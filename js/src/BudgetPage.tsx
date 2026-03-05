import React from "react";
import { useState } from "react";

import { BudgetFund } from "./generated/types";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";
import { useAppSettingsContext } from "./AppSettings";
import { BudgetCloneForm } from "./BudgetCloneForm";
import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { BudgetItemForm } from "./BudgetItemForm";
import {
  BudgetPageSettings,
  BudgetPageSettingsForm,
} from "./BudgetPageSettings";

import * as UI from "./ui/Common";

function BudgetItemRow({
  item,
  editItem,
}: {
  item: BudgetItemView;
  editItem: () => void;
}) {
  const getAmountColumns = () => {
    if (item.ignored) {
      return null;
    }

    if (item.allowance === null) {
      return (
        <>
          <td className="r-align soft">—</td>
          <td className="soft">—</td>
          <td className="r-align soft">—</td>
          <td className="r-align soft">—</td>
        </>
      );
    }

    return (
      <>
        <UI.CurrencyCell value={item.allowance.amount} />
        <td>{item.allowance.variant}</td>
        <UI.CurrencyCell value={item.amountPerYear / 12} />
        <UI.CurrencyCell value={item.amountPerYear} />
      </>
    );
  };

  return (
    <tr>
      <td className="v-center">
        <UI.InlineGlyph glyph="chevron_right" />
        {item.name}
        {item.isBudgetOnly && <UI.Pill>hidden in categorization</UI.Pill>}
        {item.isCategorizationOnly && <UI.Pill>categorization only</UI.Pill>}
        {item.fundID && <UI.Pill>fund</UI.Pill>}
        <UI.InlineGlyphButton glyph="edit" onClick={editItem} />
      </td>
      {getAmountColumns()}
    </tr>
  );
}

function BudgetCategoryRow({
  category,
  editCategory,
  addItem,
}: {
  category: BudgetCategoryView;
  editCategory: () => void;
  addItem: () => void;
}) {
  return (
    <tr className="bold highlight">
      <td className="v-center">
        {category.name}
        <UI.InlineGlyphButton glyph="edit" onClick={editCategory} />
        <UI.InlineGlyphButton glyph="add" onClick={addItem} />
      </td>
      {!category.ignored && (
        <>
          <td></td>
          <td></td>
          <UI.CurrencyCell value={category.amountPerYear / 12} />
          <UI.CurrencyCell value={category.amountPerYear} />
        </>
      )}
    </tr>
  );
}

export function BudgetTable({
  amountPerYear,
  children,
}: {
  amountPerYear?: number;
  children: React.ReactNode;
}) {
  const showAmounts = amountPerYear !== undefined && amountPerYear !== 0;

  const header = showAmounts ? (
    <tr>
      <th>Name</th>
      <th className="r-align">Allowance</th>
      <th>Frequency</th>
      <th className="r-align">Amortized monthly</th>
      <th className="r-align">Amortized yearly</th>
    </tr>
  ) : (
    <tr>
      <th>Name</th>
    </tr>
  );

  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  return (
    <table className="large">
      <thead className={useStickyHeaders ? "sticky-header" : undefined}>
        {header}
      </thead>
      <tbody>{children}</tbody>
      <tfoot>
        {showAmounts && <BudgetTableFooter amountPerYear={amountPerYear} />}
      </tfoot>
    </table>
  );
}

export function BudgetTableFooter({
  amountPerYear,
}: {
  amountPerYear: number;
}) {
  return (
    <tr className="bold">
      <td>TOTAL</td>
      <td></td>
      <td></td>
      <UI.CurrencyCell value={amountPerYear / 12} />
      <UI.CurrencyCell value={amountPerYear} />
    </tr>
  );
}

const DEFAULT_SETTINGS = {
  showSettings: false,
  showCategorizationOnlyItems: true,
} as BudgetPageSettings;

type ModalMode =
  | { variant: "hidden" }
  | { variant: "clone" }
  | { variant: "item"; item: BudgetItemView | null; categoryID: number | null }
  | { variant: "category"; category: BudgetCategoryView | null };

export function BudgetPage({
  budget,
  funds,
  refreshBudget,
  setYear,
}: {
  budget: BudgetView;
  funds: Array<BudgetFund>;
  refreshBudget: () => void;
  setYear: (number) => void; // after cloning
}) {
  const [settings, setSettings] =
    useState<BudgetPageSettings>(DEFAULT_SETTINGS);

  const toggleSettings = () => {
    setSettings({ ...settings, showSettings: !settings.showSettings });
  };

  const [modalMode, setModalMode] = useState<ModalMode>({ variant: "hidden" });

  const hideModal = () => setModalMode({ variant: "hidden" });

  const editCategory = (category: BudgetCategoryView | null) => {
    setModalMode({ variant: "category", category: category });
  };

  const editItem = (item: BudgetItemView | null, categoryID?: number) => {
    setModalMode({
      variant: "item",
      item: item,
      categoryID: categoryID ?? null,
    });
  };

  const onEditSuccess = () => {
    refreshBudget();
    hideModal();
  };

  const budgetRows: Array<React.ReactElement> = [];
  for (const category of budget.categories) {
    budgetRows.push(
      <BudgetCategoryRow
        key={category.id}
        category={category}
        editCategory={() => editCategory(category)}
        addItem={() => editItem(null, category.id)}
      />,
    );

    for (const item of category.items) {
      if (!settings.showCategorizationOnlyItems && item.isCategorizationOnly) {
        continue;
      }
      budgetRows.push(
        <BudgetItemRow
          key={`${category.id}-${item.id}`}
          item={item}
          editItem={() => editItem(item)}
        />,
      );
    }
  }

  const ignoredRows: Array<React.ReactElement> = [];
  for (const category of budget.ignoredCategories) {
    ignoredRows.push(
      <BudgetCategoryRow
        key={category.name}
        category={category}
        editCategory={() => editCategory(category)}
        addItem={() => editItem(null, category.id)}
      />,
    );

    for (const item of category.items) {
      ignoredRows.push(
        <BudgetItemRow
          key={item.name}
          item={item}
          editItem={() => editItem(item)}
        />,
      );
    }
  }

  let modalTitle = "";
  let modalContent: React.ReactNode | null = null;

  switch (modalMode.variant) {
    case "category": {
      const editedCategory = modalMode.category;
      modalTitle =
        editedCategory === null
          ? "New Budget Category"
          : "Edit Budget Category";
      modalContent = (
        <BudgetCategoryForm
          key={editedCategory?.name}
          category={editedCategory?.category ?? null}
          onSuccess={onEditSuccess}
          budget={budget}
        />
      );
      break;
    }
    case "item": {
      const editedItem = modalMode.item;
      modalTitle = editedItem === null ? "New Budget Item" : "Edit Budget Item";
      modalContent = (
        <BudgetItemForm
          key={editedItem?.displayName}
          item={editedItem?.item ?? null}
          categoryID={modalMode.categoryID}
          onSuccess={onEditSuccess}
          budget={budget}
          funds={funds}
        />
      );
      break;
    }
    case "clone": {
      modalTitle = `Clone ${budget.year} to an empty year`;
      modalContent = (
        <BudgetCloneForm
          fromYear={budget.year}
          onSuccess={(year) => {
            setYear(year);
            hideModal();
          }}
        />
      );
      break;
    }
  }

  const hasCategories = budget.categories.length > 0;

  return (
    <>
      <UI.Section title="Budget">
        <UI.Flex>
          <UI.GlyphButton
            glyph="add"
            text="add category"
            onClick={() => editCategory(null)}
          />
          {hasCategories && (
            <>
              <UI.GlyphButton
                glyph="add"
                text="add item"
                onClick={() => editItem(null)}
              />
              <UI.GlyphButton
                glyph="file_copy"
                text="clone to empty year"
                onClick={() => setModalMode({ variant: "clone" })}
              />
            </>
          )}
          <UI.GlyphButton glyph="settings" onClick={toggleSettings} />
        </UI.Flex>

        {settings.showSettings && (
          <BudgetPageSettingsForm
            settings={settings}
            updateSettings={setSettings}
          />
        )}

        <BudgetTable amountPerYear={budget.amountPerYear}>
          {budgetRows}
        </BudgetTable>
      </UI.Section>

      <UI.Section title="Ignored categories">
        <BudgetTable>{ignoredRows}</BudgetTable>
      </UI.Section>

      <UI.ModalCard
        title={modalTitle}
        visible={modalMode.variant !== "hidden"}
        hideModal={hideModal}
      >
        {modalContent}
      </UI.ModalCard>
    </>
  );
}
