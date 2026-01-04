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

  getString(fieldName: string): string {
    const value = this.getStringOrNull(fieldName);
    if (value === null || value === FormHelper.EMPTY) {
      throw new Error(`Required field '${fieldName}' was empty`);
    }
    return value;
  }

  getNumberOrNull(fieldName: string): number | null {
    const value = this.getStringOrNull(fieldName);
    return value === null || value === FormHelper.EMPTY ? null : Number(value);
  }

  getNumber(fieldName: string): number {
    const value = this.getString(fieldName);
    return Number(value);
  }

  getBool(fieldName: string): boolean {
    const value = this.formData.get(fieldName);
    return value === "on";
  }
}

const DEFAULT_ERROR = "Something went wrong.";

type FetchHelperSetErrorMessageHandler = (errorMessage: string | null) => void;
type FetchHelperSetLoadingHandler = ((isLoading: boolean) => void) | null;

export class FetchHelper {
  setErrorMessage: FetchHelperSetErrorMessageHandler;
  setLoading: FetchHelperSetLoadingHandler;

  constructor(
    setErrorMessage: FetchHelperSetErrorMessageHandler,
    setLoading?: FetchHelperSetLoadingHandler,
  ) {
    this.setErrorMessage = setErrorMessage;
    this.setLoading = setLoading ?? null;
  }

  handleError(error: unknown) {
    if (error instanceof Error) {
      this.setErrorMessage(error.message);
      return;
    }

    console.error(error);
    this.setErrorMessage(DEFAULT_ERROR);
  }

  setLoadingOptional(newValue: boolean) {
    if (this.setLoading !== null) {
      this.setLoading(newValue);
    }
  }

  async fetch(request: Request, callback: (result: object) => void) {
    try {
      this.setLoadingOptional(true);
      const response = await fetch(request);
      this.setLoadingOptional(false);

      // to get error message need to get to json in both success and error case
      // catch block will handle unexpected not-json responses
      const json = await response.json();
      if (!response.ok) {
        this.setErrorMessage(json.error ?? DEFAULT_ERROR);
        return;
      }

      callback(json);

      // if callback didn't throw, clear all previous errors;
      this.setErrorMessage(null);
    } catch (error) {
      this.setLoadingOptional(false);
      this.handleError(error);
    }
  }
}
