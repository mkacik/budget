import React from "react";
import { useState } from "react";

import { RecordMapping } from "./types/RecordMapping";
import {
  StatementSchema,
  StatementSchemaFields,
} from "./types/StatementSchema";

import {
  getDefaultRecordMapping,
  RecordMappingForm,
} from "./RecordMappingForm";
import {
  ErrorCard,
  Form,
  FormButtons,
  GlyphButton,
  InlineGlyphButton,
  ItemCard,
  ModalCard,
  SectionHeader,
} from "./ui/Common";
import { FormHelper, JSON_HEADERS } from "./Common";

function createStatementSchemaRequest(fields: StatementSchemaFields) {
  return fetch("/api/schemas", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateStatementSchemaRequest(
  schema: StatementSchema,
  fields: StatementSchemaFields,
) {
  const updated = { ...schema, ...fields };
  return fetch(`/api/schemas/${schema.id}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(updated),
  });
}

function deleteStatementSchemaRequest(schema: StatementSchema) {
  return fetch(`/api/schemas/${schema.id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

function StatementSchemaForm({
  schema,
  onSuccess,
}: {
  schema: StatementSchema | null;
  onSuccess: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordMapping, setRecordMapping] = useState<RecordMapping>(
    schema?.record_mapping ?? getDefaultRecordMapping(),
  );

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const updateRecordMapping = (newRecordMapping: RecordMapping) => {
    setRecordMapping(newRecordMapping);
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formHelper = new FormHelper(form);

    try {
      if (recordMapping === null) {
        throw new Error("Mapping must be configured for all columns");
      }

      const schemaFields: StatementSchemaFields = {
        name: formHelper.getString("name"),
        record_mapping: recordMapping,
      } as StatementSchemaFields;
      // if nothing threw by this point, mark any validation errors as cleared
      clearErrorMessage();

      const request =
        schema === null
          ? createStatementSchemaRequest(schemaFields)
          : updateStatementSchemaRequest(schema, schemaFields);
      request.then((response) => {
        if (response.ok) {
          onSuccess();
        } else {
          response
            .json()
            .then((json) => {
              const message = json.error ?? "Something went wrong!";
              setErrorMessage(message);
            })
            .catch((error) => {
              console.log(response, error);
              setErrorMessage("Something went wrong.");
            });
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        console.log(error);
      }
    }
  };

  const schemaName = schema?.name;
  const maybeErrorCard =
    errorMessage !== null ? <ErrorCard message={errorMessage} /> : null;

  let maybeDeleteButton: React.ReactNode = null;
  if (schema !== null) {
    const deleteStatementSchema = () => {
      deleteStatementSchemaRequest(schema).then((response) => {
        if (response.ok) {
          onSuccess();
        } else {
          response
            .json()
            .then((json) => {
              const message = json.error ?? "Something went wrong!";
              setErrorMessage(message);
            })
            .catch((error) => {
              console.log(response, error);
              setErrorMessage("Something went wrong.");
            });
        }
      });
    };

    maybeDeleteButton = (
      <GlyphButton glyph="delete" onClick={deleteStatementSchema} />
    );
  }

  return (
    <>
      {maybeErrorCard}
      <Form onSubmit={onSubmit}>
        <label htmlFor="name">StatementSchema Name</label>
        <input type="text" name="name" defaultValue={schemaName} />

        <RecordMappingForm
          recordMapping={recordMapping}
          updateRecordMapping={updateRecordMapping}
        />
        <FormButtons>
          {maybeDeleteButton}
          <input
            className="button"
            type="submit"
            value={schema === null ? "Create" : "Update"}
          />
        </FormButtons>
      </Form>
    </>
  );
}

export function StatementSchemasCard({
  statementSchemas,
  refreshStatementSchemas,
}: {
  statementSchemas: Array<StatementSchema>;
  refreshStatementSchemas: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [activeStatementSchema, setActiveStatementSchema] =
    useState<StatementSchema | null>(null);

  const showEditModal = (schema: StatementSchema | null) => {
    setActiveStatementSchema(schema);
    setModalVisible(true);
  };
  const hideEditModal = () => setModalVisible(false);
  const onEditSuccess = () => {
    refreshStatementSchemas();
    hideEditModal();
  };

  const rows = statementSchemas.map((schema) => {
    return (
      <ItemCard key={schema.id}>
        <span>{schema.name}</span>
        <InlineGlyphButton glyph="edit" onClick={() => showEditModal(schema)} />
      </ItemCard>
    );
  });

  return (
    <>
      <SectionHeader>Statement Schemas</SectionHeader>

      {rows}

      <GlyphButton
        glyph="add"
        text="add schema"
        onClick={() => showEditModal(null)}
      />

      <ModalCard
        title={activeStatementSchema === null ? "New Schema" : "Edit Schema"}
        visible={modalVisible}
        hideModal={hideEditModal}
      >
        <StatementSchemaForm
          key={activeStatementSchema?.name}
          schema={activeStatementSchema}
          onSuccess={onEditSuccess}
        />
      </ModalCard>
    </>
  );
}
