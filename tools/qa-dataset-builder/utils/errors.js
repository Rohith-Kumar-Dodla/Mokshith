export class BuilderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuilderError';
  }
}

export class ConfigurationError extends BuilderError {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends BuilderError {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class EnvironmentError extends BuilderError {
  constructor(message) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

