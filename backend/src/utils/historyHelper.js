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
  if (val === null || val === undefined || val === 'null' || val === 'N/A') return '';
  if (typeof val === 'object') return ''; // Avoid [object Object]
  return String(val);
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

  // 3. Build history entries
  logs.forEach(log => {
    const oldVal = log.old_values || {};
    const newVal = log.new_values || {};
    
    // Determine which fields to compare. 
    // We check both old and new keys to ensure we catch field additions/removals.
    const allFields = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    const fields = Array.from(allFields).filter(f => 
      f !== 'updatedAt' && 
      f !== 'createdAt' && 
      f !== 'gallery' && 
      f !== 'id' && 
      f !== 'password_hash' &&
      typeof oldVal[f] !== 'object' && 
      typeof newVal[f] !== 'object' &&
      newVal[f] !== undefined // ONLY track if field is in new values
    );

    fields.forEach(f => {
      let vOld = oldVal[f];
      let vNew = newVal[f];

      // Deep compare if needed, but here simple stringify check is usually enough for primitives
      if (JSON.stringify(vOld) !== JSON.stringify(vNew)) {
        // Resolve IDs to names if applicable
        if (ID_FIELD_MAP[f]) {
          const modelName = ID_FIELD_MAP[f].model.name;
          vOld = nameCache[modelName]?.[vOld] || vOld;
          vNew = nameCache[modelName]?.[vNew] || vNew;
        }

        history.push({
          user: log.user?.first_name || log.user?.username || 'System',
          timestamp: log.createdAt,
          field: f.replace(/_/g, ' ').toUpperCase(),
          old_value: formatValue(vOld),
          new_value: formatValue(vNew)
        });
      }
    });
  });

  return history;
};

module.exports = { getFormattedHistory };
