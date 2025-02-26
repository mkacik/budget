import React from "react";
import { useState } from "react";

import { RecordMapping } from "./types/RecordMapping";
import {
  StatementSchema,
  StatementSchemaFields,
} from "./types/StatementSchema";

import { RecordMappingForm } from "./RecordMappingForm";
import { FormHelper } from "./FormHelper";
import { ErrorCard, ModalCard } from "./CommonUI";
import { JSON_HEADERS } from "./Common";

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
  hideEditForm,
  refreshStatementSchemas,
}: {
  schema: StatementSchema | null;
  hideEditForm: () => void;
  refreshStatementSchemas: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordMapping, setRecordMapping] = useState<RecordMapping | null>(
    schema?.record_mapping ?? null,
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
          refreshStatementSchemas();
          hideEditForm();
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
          refreshStatementSchemas();
          hideEditForm();
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
      <div>
        <button onClick={deleteStatementSchema}>[delete]</button>
      </div>
    );
  }

  return (
    <div>
      {maybeErrorCard}
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">StatementSchema Name</label>
          <input type="text" name="name" defaultValue={schemaName} />
        </div>

        <RecordMappingForm
          recordMapping={recordMapping}
          updateRecordMapping={updateRecordMapping}
        />
        <div>
          <input type="submit" value={schema === null ? "Create" : "Update"} />
        </div>
      </form>
      {maybeDeleteButton}
    </div>
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

  const hideEditModal = () => setModalVisible(false);
  const showEditModal = (schema: StatementSchema | null) => {
    setActiveStatementSchema(schema);
    setModalVisible(true);
  };

  const rows = statementSchemas.map((schema) => {
    return (
      <div key={schema.id}>
        <span>{schema.name}</span>
        <span onClick={() => showEditModal(schema)}>[edit]</span>
      </div>
    );
  });

  return (
    <div>
      {rows}
      <div>
        <span onClick={() => showEditModal(null)}>[add new]</span>
      </div>

      <ModalCard visible={modalVisible}>
        <StatementSchemaForm
          key={activeStatementSchema?.name}
          schema={activeStatementSchema}
          hideEditForm={hideEditModal}
          refreshStatementSchemas={refreshStatementSchemas}
        />
      </ModalCard>
    </div>
  );
}
