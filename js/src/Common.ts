export const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

export class FormHelper {
  static EMPTY: string = "";
  formData: FormData;

  constructor(form: HTMLFormElement) {
    this.formData = new FormData(form);
  }

  getStringOrNull(fieldName: string): string | null {
    const value = this.formData.get(fieldName);
    if (value === null) {
      return null;
    }
    if (typeof value !== "string") {
      throw new Error("File input found where string was expected.");
    }
    return value;
  }

  getNumberOrNull(fieldName: string): number | null {
    const value = this.getStringOrNull(fieldName);
    return value === null || value === FormHelper.EMPTY ? null : Number(value);
  }

  getString(fieldName: string): string {
    const value = this.getStringOrNull(fieldName);
    if (value === null || value === FormHelper.EMPTY) {
      throw new Error(`Required field ${fieldName} was empty`);
    }
    return value;
  }
}
