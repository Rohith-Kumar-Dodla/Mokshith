import AppError from './AppError.js';

class PermissionError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 403);
    this.name = 'PermissionError';
  }
}

export default PermissionError;
