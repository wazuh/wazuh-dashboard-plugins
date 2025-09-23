export class DetailsError extends Error {
  constructor(message: string, public type: string, public details?: any) {
    super(message);
  }
}

export class ErrorDataSourceServerAPIContextFilter extends DetailsError {
  static type = 'data_source_server_api_context_filter';
  constructor(message: string, details?: any) {
    super(message, ErrorDataSourceServerAPIContextFilter.type, details);
  }
}

export class ErrorDataSourceAlertsSelect extends DetailsError {
  static type = 'data_source_select';
  constructor(message: string, details?: any) {
    super(message, ErrorDataSourceAlertsSelect.type, details);
  }
}

export class ErrorDataSourceNotFound extends DetailsError {
  static type = 'data_source_not_found';
  constructor(message: string, details?: any) {
    super(message, ErrorDataSourceNotFound.type, details);
  }
}
