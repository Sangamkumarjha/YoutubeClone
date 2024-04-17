class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something Went Wrong",
    errors = [],
    statck = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.data = null;
    this.success = false;

    if (statck) {
      this.statck = statck;
    } else {
      Error.captureStackTrace(this, this.constroctor);
    }
  }
}
export { ApiError };
