const success = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res, message = 'Unexpected error', status = 500, meta = {}) =>
  res.status(status).json({ success: false, message, ...meta });

module.exports = { success, fail };

