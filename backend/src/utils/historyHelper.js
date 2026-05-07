const { Entity, MenuCategory, CuisineType, EventType, Performer, Category, User } = require('../models');

const ID_FIELD_MAP = {
  property_id: { model: Entity, label: 'Property' },
  menu_category_id: { model: MenuCategory, label: 'Menu Category' },
  cuisine_type_id: { model: CuisineType, label: 'Cuisine Type' },
  event_type_id: { model: EventType, label: 'Event Type' },
  performer_id: { model: Performer, label: 'Performer' },
  category_id: { model: Category, label: 'Category' },
  entity_user_id: { model: User, label: 'Entity User' },
  admin_user_id: { model: User, label: 'Admin User' }
};

const formatValue = (val) => {
  if (val === null || val === undefined || val === 'null' || val === 'N/A' || val === '') return '-';
  
  // Normalize Booleans
  if (val === true || val === 'true' || val === 1 || val === '1') return 'Yes';
  if (val === false || val === 'false' || val === 0 || val === '0') return 'No';

  if (val instanceof Date) return val.toISOString().split('T')[0];
  
  if (typeof val === 'object') {
    // Check if it's an empty array or object
    if (Array.isArray(val) && val.length === 0) return '-';
    if (Object.keys(val).length === 0) return '-';
    return '-'; 
  }
  
  const str = String(val).trim();
  
  // Try to normalize numbers (pure numeric)
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return String(parseFloat(str));
  }

  // Try to normalize ISO dates
  if (str.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return str.split('T')[0];
  }

  return str;
};

const getFormattedHistory = async (logs) => {
  const history = [];
  
  // 1. Identify all unique IDs for each model to fetch in bulk
  const idMap = {}; // { modelName: Set of IDs }
  
  logs.forEach(log => {
    const oldVal = log.old_values || {};
    const newVal = log.new_values || {};
    const combined = { ...oldVal, ...newVal };
    
    Object.keys(combined).forEach(field => {
      if (ID_FIELD_MAP[field]) {
        const modelName = ID_FIELD_MAP[field].model.name;
        if (!idMap[modelName]) idMap[modelName] = new Set();
        if (oldVal[field] && typeof oldVal[field] === 'string' && oldVal[field].length > 10) idMap[modelName].add(oldVal[field]);
        if (newVal[field] && typeof newVal[field] === 'string' && newVal[field].length > 10) idMap[modelName].add(newVal[field]);
      }
    });
  });

  // 2. Fetch all names for the IDs found
  const nameCache = {}; // { modelName: { id: name } }
  await Promise.all(Object.keys(idMap).map(async modelName => {
    const mapping = Object.values(ID_FIELD_MAP).find(m => m.model.name === modelName);
    const model = mapping.model;
    const ids = Array.from(idMap[modelName]);
    
    if (ids.length === 0) return;

    const attributes = ['id'];
    if (modelName === 'User') attributes.push('first_name', 'username');
    else attributes.push('name');

    const records = await model.findAll({
      where: { id: ids },
      attributes
    });
    
    nameCache[modelName] = {};
    records.forEach(r => {
      nameCache[modelName][r.id] = r.name || r.first_name || r.username || r.id;
    });
  }));

    // Build history entries
    logs.forEach(log => {
      let oldVal = log.old_values || {};
      let newVal = log.new_values || {};
      
      // Defensive parsing in case Sequelize didn't auto-parse
      try { if (typeof oldVal === 'string') oldVal = JSON.parse(oldVal); } catch(e){}
      try { if (typeof newVal === 'string') newVal = JSON.parse(newVal); } catch(e){}
      if (!oldVal) oldVal = {};
      if (!newVal) newVal = {};

      const isCreate = log.action.toUpperCase().includes('CREATE');
      const actor = log.user?.first_name || log.user?.username || 'System';
      const ts = log.createdAt;
      const ip = log.ip_address || 'N/A';
      
      if (isCreate) {
        history.push({ user: actor, timestamp: ts, field: 'ACTION', old_value: '-', new_value: 'RECORD CREATED', ip_address: ip });
        const idField = ['name', 'title', 'username', 'entity_code'].find(f => newVal[f]);
        if (idField) {
          history.push({ user: actor, timestamp: ts, field: idField.replace(/_/g, ' ').toUpperCase(), old_value: '-', new_value: formatValue(newVal[idField]), ip_address: ip });
        }
        return;
      }

      const allFields = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
      const fields = Array.from(allFields).filter(f => {
        if (['updatedAt', 'createdAt', 'gallery', 'id', 'password_hash', 'unique_number'].includes(f)) return false;
        return newVal[f] !== undefined;
      });
  
      fields.forEach(f => {
        let vOld = oldVal[f];
        let vNew = newVal[f];
  
        if (ID_FIELD_MAP[f]) {
          const modelName = ID_FIELD_MAP[f].model.name;
          vOld = nameCache[modelName]?.[vOld] || vOld;
          vNew = nameCache[modelName]?.[vNew] || vNew;
        }
  
        const formattedOld = formatValue(vOld);
        const formattedNew = formatValue(vNew);
  
        if (formattedOld !== formattedNew && (formattedOld !== '-' || formattedNew !== '-')) {
          history.push({
            user: actor,
            timestamp: ts,
            field: f.replace(/_/g, ' ').toUpperCase(),
            old_value: formattedOld,
            new_value: formattedNew,
            ip_address: ip
          });
        }
      });
    });

    // Final De-duplication check
    const uniqueHistory = [];
    const seen = new Set();
    history.forEach(h => {
      const key = `${h.timestamp}-${h.field}-${h.old_value}-${h.new_value}`;
      if (!seen.has(key)) {
        uniqueHistory.push(h);
        seen.add(key);
      }
    });

  return uniqueHistory;
};

const hasChanges = (oldVal, newVal) => {
  if (!newVal || Object.keys(newVal).length === 0) return false;
  const fields = Object.keys(newVal).filter(f => !['updatedAt', 'createdAt', 'id'].includes(f));
  for (const f of fields) {
    if (formatValue(oldVal[f]) !== formatValue(newVal[f])) return true;
  }
  return false;
};

const extractDeltas = (oldVal, newVal) => {
  const delta = {};
  if (!newVal) return delta;
  Object.keys(newVal).forEach(key => {
    if (!['updatedAt', 'createdAt', 'id'].includes(key)) {
      if (formatValue(oldVal[key]) !== formatValue(newVal[key])) {
        delta[key] = newVal[key];
      }
    }
  });
  return delta;
};

module.exports = { getFormattedHistory, hasChanges, extractDeltas };
