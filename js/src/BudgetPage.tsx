import React from "react";
import { useState } from "react";

import { BudgetFund } from "./types/Fund";
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

    if (item.isCategorizationOnly) {
      return (
        <>
          <td className="r-align soft">—</td>
          <td className="r-align soft">—</td>
        </>
      );
    }

    return (
      <>
        <td className="number r-align">
          {(item.amountPerYear / 12).toFixed(2)}
        </td>
        <td className="number r-align">{item.amountPerYear.toFixed(2)}</td>
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
}: {
  category: BudgetCategoryView;
  editCategory: () => void;
}) {
  return (
    <tr className="bold highlight">
      <td className="v-center">
        {category.name}
        <UI.InlineGlyphButton glyph="edit" onClick={editCategory} />
      </td>
      {!category.ignored && (
        <>
          <td className="number r-align">
            {(category.amountPerYear / 12).toFixed(2)}
          </td>
          <td className="number r-align">
            {category.amountPerYear.toFixed(2)}
          </td>
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
  let header = amountPerYear ? (
    <tr>
      <th>Name</th>
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
        {amountPerYear && <BudgetTableFooter amountPerYear={amountPerYear} />}
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
      <td className="number r-align">{(amountPerYear / 12).toFixed(2)}</td>
      <td className="number r-align">{amountPerYear.toFixed(2)}</td>
    </tr>
  );
}

const DEFAULT_SETTINGS = {
  showSettings: false,
  showCategorizationOnlyItems: true,
} as BudgetPageSettings;

enum ModalMode {
  CATEGORY,
  ITEM,
  CLONE,
  HIDDEN,
}

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

  const budgetRows: Array<React.ReactElement> = [];
  for (const category of budget.categories) {
    budgetRows.push(
      <BudgetCategoryRow
        key={category.id}
        editCategory={() => editCategory(category)}
        category={category}
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
        editCategory={() => editCategory(category)}
        category={category}
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

  let modalTitle: string = "";
  let modalContent: React.ReactNode = null;
  switch (modalMode) {
    case ModalMode.CATEGORY: {
      modalTitle =
        editedCategory === null
          ? "New Budget Category"
          : "Edit Budget Category";
      modalContent = (
        <BudgetCategoryForm
          key={editedCategory?.name}
          budgetCategory={editedCategory?.category ?? null}
          onSuccess={onEditSuccess}
          budget={budget}
        />
      );
      break;
    }
    case ModalMode.ITEM: {
      modalTitle = editedItem === null ? "New Budget Item" : "Edit Budget Item";
      modalContent = (
        <BudgetItemForm
          key={editedItem?.name}
          budgetItem={editedItem?.item ?? null}
          onSuccess={onEditSuccess}
          budget={budget}
          funds={funds}
        />
      );
      break;
    }
    case ModalMode.CLONE: {
      modalTitle = `Clone ${budget.year} to an empty year`;
      modalContent = (
        <BudgetCloneForm
          fromYear={budget.year}
          onSuccess={(year) => {
            setModalMode(ModalMode.HIDDEN);
            setYear(year);
          }}
        />
      );
      break;
    }
    default:
      break;
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
                onClick={() => setModalMode(ModalMode.CLONE)}
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
        visible={modalMode !== ModalMode.HIDDEN}
        hideModal={() => setModalMode(ModalMode.HIDDEN)}
      >
        {modalContent}
      </UI.ModalCard>
    </>
  );
}
