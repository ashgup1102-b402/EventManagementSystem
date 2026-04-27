const { Discount, ComboDeal } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Calculate the best applicable discount for a booking.
 * @param {string} propertyId
 * @param {object} bookingData - { booking_type, event_id, slot_id, items, subtotal, booking_date, promo_code }
 * @returns {{ discount_amount, discount_id, applied_discount_name }}
 */
const calculateDiscount = async (propertyId, bookingData) => {
  const today = moment().format('YYYY-MM-DD');
  const { subtotal = 0, booking_type, event_id, slot_id, items = [], promo_code } = bookingData;

  // Fetch all active discounts for this property
  const discounts = await Discount.findAll({
    where: {
      property_id: propertyId,
      is_active: true,
      [Op.or]: [
        { valid_from: null },
        { valid_from: { [Op.lte]: today } }
      ],
      [Op.or]: [
        { valid_to: null },
        { valid_to: { [Op.gte]: today } }
      ]
    }
  });

  let bestDiscount = null;
  let bestDiscountAmount = 0;
  let matchedDiscount = null;

  for (const discount of discounts) {
    // Check promo code if set
    if (discount.promo_code && discount.promo_code !== promo_code) continue;

    // Check usage limit
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) continue;

    // Check min booking amount
    if (discount.min_booking_amount && subtotal < parseFloat(discount.min_booking_amount)) continue;

    // Check applicability
    let isApplicable = false;
    if (discount.applicable_on === 'total') {
      isApplicable = true;
    } else if (discount.applicable_on === 'all_events' && booking_type === 'event_ticket') {
      isApplicable = true;
    } else if (discount.applicable_on === 'event' && event_id && discount.applicable_id === event_id) {
      isApplicable = true;
    } else if (discount.applicable_on === 'all_menu' && items.some(i => i.item_type === 'menu_item')) {
      isApplicable = true;
    } else if (discount.applicable_on === 'menu_item') {
      isApplicable = items.some(i => i.item_type === 'menu_item' && i.item_id === discount.applicable_id);
    } else if (discount.applicable_on === 'slot' && slot_id && discount.applicable_id === slot_id) {
      isApplicable = true;
    } else if (discount.applicable_on === 'combo_deal') {
      isApplicable = items.some(i => i.item_type === 'combo_deal' && i.item_id === discount.applicable_id);
    }

    if (!isApplicable) continue;

    // Calculate discount amount
    let amount = 0;
    if (discount.discount_type === 'percentage') {
      amount = (subtotal * parseFloat(discount.discount_value)) / 100;
      if (discount.max_discount_amount) {
        amount = Math.min(amount, parseFloat(discount.max_discount_amount));
      }
    } else {
      amount = parseFloat(discount.discount_value);
    }

    amount = Math.min(amount, subtotal); // Cannot exceed subtotal

    if (amount > bestDiscountAmount) {
      bestDiscountAmount = amount;
      bestDiscount = discount;
    }
  }

  return {
    discount_amount: Math.round(bestDiscountAmount * 100) / 100,
    discount_id: bestDiscount?.id || null,
    applied_discount_name: bestDiscount?.name || null
  };
};

module.exports = { calculateDiscount };
