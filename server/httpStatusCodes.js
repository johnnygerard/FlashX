// Data extracted from:
// https://www.rfc-editor.org/rfc/rfc9110#name-status-codes

// Informational 1xx
export const CONTINUE = 100;
export const SWITCHING_PROTOCOLS = 101;

// Successful 2xx
export const OK = 200;
export const CREATED = 201;
export const ACCEPTED = 202;
export const NON_AUTHORITATIVE_INFORMATION = 203;
export const NO_CONTENT = 204;
export const RESET_CONTENT = 205;
export const PARTIAL_CONTENT = 206;

// Redirection 3xx
export const MULTIPLE_CHOICES = 300;
export const MOVED_PERMANENTLY = 301;
export const FOUND = 302;
export const SEE_OTHER = 303;
export const NOT_MODIFIED = 304;
export const USE_PROXY = 305;
export const TEMPORARY_REDIRECT = 307;
export const PERMANENT_REDIRECT = 308;

// Client Error 4xx
export const BAD_REQUEST = 400;
export const UNAUTHORIZED = 401;
export const PAYMENT_REQUIRED = 402;
export const FORBIDDEN = 403;
export const NOT_FOUND = 404;
export const METHOD_NOT_ALLOWED = 405;
export const NOT_ACCEPTABLE = 406;
export const PROXY_AUTHENTICATION_REQUIRED = 407;
export const REQUEST_TIMEOUT = 408;
export const CONFLICT = 409;
export const GONE = 410;
export const LENGTH_REQUIRED = 411;
export const PRECONDITION_FAILED = 412;
export const CONTENT_TOO_LARGE = 413;
export const URI_TOO_LONG = 414;
export const UNSUPPORTED_MEDIA_TYPE = 415;
export const RANGE_NOT_SATISFIABLE = 416;
export const EXPECTATION_FAILED = 417;
export const MISDIRECTED_REQUEST = 421;
export const UNPROCESSABLE_CONTENT = 422;
export const UPGRADE_REQUIRED = 426;

// Server Error 5xx
export const INTERNAL_SERVER_ERROR = 500;
export const NOT_IMPLEMENTED = 501;
export const BAD_GATEWAY = 502;
export const SERVICE_UNAVAILABLE = 503;
export const GATEWAY_TIMEOUT = 504;
export const HTTP_VERSION_NOT_SUPPORTED = 505;
