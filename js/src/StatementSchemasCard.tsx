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
import { FetchHelper, JSON_HEADERS } from "./Common";
import { Section } from "./ui/Common";

function createStatementSchemaRequest(fields: StatementSchemaFields): Request {
  return new Request("/api/schemas", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateStatementSchemaRequest(
  schema: StatementSchema,
  fields: StatementSchemaFields,
): Request {
  const updated = { ...schema, ...fields };
  return new Request(`/api/schemas/${schema.id}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(updated),
  });
}

function deleteStatementSchemaRequest(schema: StatementSchema): Request {
  return new Request(`/api/schemas/${schema.id}`, {
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

  const fetchHelper = new FetchHelper(setErrorMessage);

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

      const request =
        schema === null
          ? createStatementSchemaRequest(schemaFields)
          : updateStatementSchemaRequest(schema, schemaFields);
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = schema && (
    <GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(deleteStatementSchemaRequest(schema), (_json) =>
          onSuccess(),
        )
      }
    />
  );

  return (
    <>
      <ErrorCard message={errorMessage} />

      <Form onSubmit={onSubmit}>
        <label>Statement Schema Name</label>
        <input type="text" value={fields.name} onChange={setName} />

        <label>Notes/Instructions</label>
        <textarea value={fields.notes} onChange={setNotes} />

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
      <Section>
        <GlyphButton
          glyph="add"
          text="add schema"
          onClick={() => showEditModal(null)}
        />
      </Section>

      {rows}

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
