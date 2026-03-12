export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Customer with email ${email} already exists`, "EMAIL_ALREADY_EXISTS", 409);
    this.name = "EmailAlreadyExistsError";
  }
}

export class CustomerNotFoundError extends DomainError {
  constructor(id: number) {
    super(`Customer with id ${id} not found`, "CUSTOMER_NOT_FOUND", 404);
    this.name = "CustomerNotFoundError";
  }
}
