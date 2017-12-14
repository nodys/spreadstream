
/**
 * Type of objects from input stream
 * @type {Object}
 */
exports.streamType = {
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT'
}
/**
 * Type of objects from input stream
 * @type {Object}
 */
exports.mode = {
  READING: 'READING',
  WRITING: 'WRITING'
}

/**
 * Determines how input data should be interpreted
 * @type {Object}
 * @see https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
 */
exports.valueInput = {
  USER_ENTERED: 'USER_ENTERED',
  RAW: 'RAW'
}

/**
 * Indicates which dimension read operation should apply to
 * @type {Object}
 * @see https://developers.google.com/sheets/api/reference/rest/v4/Dimension
 */
exports.majorDimension = {
  COLUMNS: 'COLUMNS',
  ROWS: 'ROWS'
}

/**
 * Determines how values should be rendered in the the output.
 * @type {Object}
 * @see https://developers.google.com/sheets/api/reference/rest/v4/valueRender#ENUM_VALUES.FORMATTED_VALUE
 */
exports.valueRender = {
  FORMATTED_VALUE: 'FORMATTED_VALUE',
  UNFORMATTED_VALUE: 'UNFORMATTED_VALUE',
  FORMULA: 'FORMULA'
}

/**
 * Determines how dates should be rendered in the the output.
 * @type {Object}
 * @see https://developers.google.com/sheets/api/reference/rest/v4/dateTimeRender
 */
exports.dateTimeRender = {
  SERIAL_NUMBER: 'SERIAL_NUMBER',
  FORMATTED_STRING: 'FORMATTED_STRING'
}
