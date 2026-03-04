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
  Form,
  FormButtons,
  FormSubmitButton,
  LabeledInput,
  LabeledTextArea,
} from "./ui/Form";
import { FetchHelper, JSON_HEADERS } from "./Common";
import { useAppSettingsContext } from "./AppSettings";

import * as UI from "./ui/Common";

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
    method: "PUT",
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
        throw Error("Mapping must be configured for all columns");
      }
      const newFields: StatementSchemaFields = {
        name: updatedName,
        notes: fields.notes,
        record_mapping: fields.record_mapping,
      } as StatementSchemaFields;

      const request =
        schema === null
          ? createStatementSchemaRequest(newFields)
          : updateStatementSchemaRequest(schema, newFields);
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  return (
    <>
      <UI.ErrorCard message={errorMessage} />

      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="Statement Schema Name"
          type="text"
          value={fields.name}
          onChange={setName}
        />

        <LabeledTextArea
          label="Notes/Instructions"
          value={fields.notes}
          onChange={setNotes}
        />

        <RecordMappingForm
          recordMapping={fields.record_mapping}
          updateRecordMapping={setRecordMapping}
        />

        <FormButtons>
          {schema && (
            <UI.GlyphButton
              glyph="delete"
              onClick={() =>
                fetchHelper.fetch(
                  deleteStatementSchemaRequest(schema),
                  (_json) => onSuccess(),
                )
              }
            />
          )}
          <FormSubmitButton text={schema === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>

      <SchemaTestForm fields={fields} />
    </>
  );
}

function StatementSchemasTable({
  schemas,
  editSchema,
}: {
  schemas: Array<StatementSchema>;
  editSchema: (schema: StatementSchema | null) => void;
}) {
  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  const rows = schemas.map((schema) => {
    return (
      <tr key={schema.id}>
        <td className="v-center">
          {schema.name}
          <UI.InlineGlyphButton
            glyph="edit"
            onClick={() => editSchema(schema)}
          />
        </td>
      </tr>
    );
  });

  return (
    <table className="large">
      <thead className={useStickyHeaders ? "sticky-header" : undefined}>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

export function StatementSchemasSection({
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

  const editSchema = (schema: StatementSchema | null) => {
    setActiveSchema(schema);
    setModalVisible(true);
  };
  const hideModal = () => setModalVisible(false);
  const onEditSuccess = () => {
    refreshSchemas();
    hideModal();
  };

  return (
    <UI.Section title="Statement Schemas">
      <UI.GlyphButton
        glyph="add"
        text="add schema"
        onClick={() => editSchema(null)}
      />

      <StatementSchemasTable schemas={schemas} editSchema={editSchema} />

      <UI.ModalCard
        title={activeSchema === null ? "New Schema" : "Edit Schema"}
        visible={modalVisible}
        hideModal={hideModal}
      >
        <StatementSchemaForm
          key={activeSchema?.name}
          schema={activeSchema}
          onSuccess={onEditSuccess}
        />
      </UI.ModalCard>
    </UI.Section>
  );
}
