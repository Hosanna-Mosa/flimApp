/**
 * Business-rule failures must carry an HTTP status: the error middleware masks
 * any status-less error as a 500 "Internal Server Error", which is how
 * "not found" and "you do not have permission" were reaching the app as blank
 * server errors.
 */
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = { httpError };
