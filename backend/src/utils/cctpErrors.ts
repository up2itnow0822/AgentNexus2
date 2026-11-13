/** HTTP-facing CCTP errors with stable status codes and generic client messages. */

export class CctpHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly clientMessage: string
  ) {
    super(clientMessage);
    this.name = 'CctpHttpError';
  }
}

export class CctpBeneficiaryForbiddenError extends CctpHttpError {
  constructor() {
    super(403, 'Beneficiary not authorized for this relay');
  }
}

export class CctpValidationError extends CctpHttpError {
  constructor() {
    super(400, 'Invalid CCTP payment request');
  }
}

export class CctpRelayUnavailableError extends CctpHttpError {
  constructor() {
    super(503, 'CCTP relay unavailable');
  }
}

export class CctpRateLimitError extends CctpHttpError {
  constructor(message = 'Too many CCTP submit requests; try again later') {
    super(429, message);
  }
}
