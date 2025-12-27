function clientContext(req, res, next) {
  const clientId = req.headers["x-client-id"] || req.query.clientId;
  const companyId = req.headers["x-company-id"] || req.query.companyId;

  req.context = {
    clientId: clientId || null,
    companyId: companyId || null,
  };

  next();
}

module.exports = { clientContext };
