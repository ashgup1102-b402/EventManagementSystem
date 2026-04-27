const { Event, PropertySlot, sequelize } = require('../models');

/**
 * Check if a booking can be made (capacity check) and reserve seats atomically.
 */
const checkAndReserve = async (type, resourceId, numGuests, transaction) => {
  if (type === 'event_ticket') {
    const event = await Event.findByPk(resourceId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) throw { statusCode: 404, message: 'Event not found.' };
    if (!event.is_active) throw { statusCode: 400, message: 'Event is no longer active.' };

    const available = event.total_capacity - event.booked_count;
    if (available < numGuests) {
      throw {
        statusCode: 409,
        message: `Only ${available} seat(s) remaining for this event. You requested ${numGuests}.`
      };
    }
    await event.update({ booked_count: event.booked_count + numGuests }, { transaction });
    return { total_capacity: event.total_capacity, booked_count: event.booked_count, available_after: available - numGuests };

  } else if (type === 'table_reservation') {
    const slot = await PropertySlot.findByPk(resourceId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!slot) throw { statusCode: 404, message: 'Slot not found.' };
    if (!slot.is_active) throw { statusCode: 400, message: 'Slot is no longer available.' };

    if (numGuests < slot.min_guests) throw { statusCode: 400, message: `Minimum ${slot.min_guests} guest(s) required.` };
    if (numGuests > slot.max_guests) throw { statusCode: 400, message: `Maximum ${slot.max_guests} guest(s) allowed.` };

    const available = slot.total_capacity - slot.booked_count;
    if (available < numGuests) {
      throw {
        statusCode: 409,
        message: `Only ${available} seat(s) remaining for this slot. You requested ${numGuests}.`
      };
    }
    await slot.update({ booked_count: slot.booked_count + numGuests }, { transaction });
    return { total_capacity: slot.total_capacity, booked_count: slot.booked_count, available_after: available - numGuests };
  }

  return null;
};

/**
 * Release reserved seats on cancellation.
 */
const releaseSeats = async (type, resourceId, numGuests, transaction) => {
  if (type === 'event_ticket' && resourceId) {
    const event = await Event.findByPk(resourceId, { transaction });
    if (event) {
      const newCount = Math.max(0, event.booked_count - numGuests);
      await event.update({ booked_count: newCount }, { transaction });
    }
  } else if (type === 'table_reservation' && resourceId) {
    const slot = await PropertySlot.findByPk(resourceId, { transaction });
    if (slot) {
      const newCount = Math.max(0, slot.booked_count - numGuests);
      await slot.update({ booked_count: newCount }, { transaction });
    }
  }
};

/**
 * Get availability info for display.
 */
const getAvailability = async (type, resourceId) => {
  if (type === 'event') {
    const event = await Event.findByPk(resourceId);
    if (!event) return null;
    return {
      total: event.total_capacity,
      booked: event.booked_count,
      available: event.total_capacity - event.booked_count,
      percentage_booked: Math.round((event.booked_count / event.total_capacity) * 100)
    };
  } else if (type === 'slot') {
    const slot = await PropertySlot.findByPk(resourceId);
    if (!slot) return null;
    return {
      total: slot.total_capacity,
      booked: slot.booked_count,
      available: slot.total_capacity - slot.booked_count,
      percentage_booked: Math.round((slot.booked_count / slot.total_capacity) * 100)
    };
  }
  return null;
};

module.exports = { checkAndReserve, releaseSeats, getAvailability };
