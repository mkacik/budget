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
import { SchemaTestForm } from "./SchemaTestForm";
import {
  ErrorCard,
  GlyphButton,
  InlineGlyphButton,
  ItemCard,
  ModalCard,
  SectionHeader,
} from "./ui/Common";
import { Form, FormButtons, FormSubmitButton } from "./ui/Form";
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
  onSuccess,
}: {
  schema: StatementSchema | null;
  onSuccess: () => void;
}) {
  const initialFields = {
    name: schema?.name ?? "",
    notes: schema?.notes ?? "",
    record_mapping: schema?.record_mapping ?? getDefaultRecordMapping(),
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<StatementSchemaFields>(initialFields);

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const setName = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    setFields({ ...fields, name: target.value });
  };

  const setNotes = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    setFields({ ...fields, notes: target.value });
  };

  const setRecordMapping = (newRecordMapping: RecordMapping) => {
    setFields({ ...fields, record_mapping: newRecordMapping });
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const updatedName = fields.name.trim();
      if (updatedName === "") {
        throw Error("Budget Item Name can't be empty!");
      }
      if (fields.record_mapping === null) {
        throw new Error("Mapping must be configured for all columns");
      }

      const schemaFields: StatementSchemaFields = {
        name: updatedName,
        notes: fields.notes,
        record_mapping: fields.record_mapping,
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
      <ErrorCard message={errorMessage} />

      <Form onSubmit={onSubmit}>
        <label>Statement Schema Name</label>
        <input type="text" value={fields.name} onChange={setName} />

        <label>Notes/Instructions</label>
        <input type="text" value={fields.notes} onChange={setNotes} />

        <RecordMappingForm
          recordMapping={fields.record_mapping}
          updateRecordMapping={setRecordMapping}
        />

        <FormButtons>
          {maybeDeleteButton}
          <FormSubmitButton text={schema === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>

      <SchemaTestForm fields={fields} />
    </>
  );
}

export function StatementSchemasCard({
  schemas,
  refreshSchemas,
}: {
  schemas: Array<StatementSchema>;
  refreshSchemas: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [activeSchema, setActiveSchema] = useState<StatementSchema | null>(
    null,
  );

  const showEditModal = (schema: StatementSchema | null) => {
    setActiveSchema(schema);
    setModalVisible(true);
  };
  const hideEditModal = () => setModalVisible(false);
  const onEditSuccess = () => {
    refreshSchemas();
    hideEditModal();
  };

  const rows = schemas.map((schema) => {
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
        title={activeSchema === null ? "New Schema" : "Edit Schema"}
        visible={modalVisible}
        hideModal={hideEditModal}
      >
        <StatementSchemaForm
          key={activeSchema?.name}
          schema={activeSchema}
          onSuccess={onEditSuccess}
        />
      </ModalCard>
    </>
  );
}
