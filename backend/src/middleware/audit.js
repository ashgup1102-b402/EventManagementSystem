const { AuditLog } = require('../models');

/**
 * Middleware to automatically log administrative actions to the AuditLog table.
 * @param {string} entityType - The type of entity being modified (e.g., 'Event', 'Menu', 'Entity')
 */
const auditLog = (entityType) => {
  return async (req, res, next) => {
    // Only log mutations (POST, PUT, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Capture the original send to intercept the response
    const originalSend = res.send;
    
    res.send = function (data) {
      // Restore original send and finish the request
      res.send = originalSend;
      res.send.apply(res, arguments);

      // Log after successful response (status code 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const responseBody = JSON.parse(data);
          
          // Determine entity ID from URL or response
          const entityId = req.params.id || responseBody.data?.id || 'N/A';
          
          let action = '';
          switch (req.method) {
            case 'POST': action = `CREATE_${entityType.toUpperCase()}`; break;
            case 'PUT': 
            case 'PATCH': action = `UPDATE_${entityType.toUpperCase()}`; break;
            case 'DELETE': action = `DELETE_${entityType.toUpperCase()}`; break;
          }

          // Don't log passwords or sensitive data
          const safeBody = { ...req.body };
          delete safeBody.password;
          delete safeBody.password_hash;

          AuditLog.create({
            user_id: req.user?.id || null,
            action,
            entity_type: entityType,
            entity_id: String(entityId),
            old_values: req.old_data || null, // Optional: some routes might provide this
            new_values: safeBody,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          }).catch(err => console.error('Audit Logging Error:', err));
          
        } catch (err) {
          // If data is not JSON or parsing fails, just ignore
        }
      }
    };

    next();
  };
};

module.exports = auditLog;
