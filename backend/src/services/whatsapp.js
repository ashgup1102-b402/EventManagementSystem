/**
 * WhatsApp Service using WPPConnect
 * 
 * NOTE: WPPConnect requires a running Chromium browser.
 * Install: npm install @wppconnect-team/wppconnect
 * 
 * This service is designed to be lazy-initialized per property session.
 * Each property scans a QR code once and the session is persisted locally.
 */

const path = require('path');
const { WhatsappLog, SystemConfig, Property } = require('../models');

// Sessions store: { [sessionId]: client }
const sessions = {};

/**
 * Initialize WPPConnect lazily (only when needed).
 * Wrapped to handle environments where wppconnect is not yet installed.
 */
const initWPP = async () => {
  try {
    return require('@wppconnect-team/wppconnect');
  } catch (e) {
    console.warn('⚠️  WPPConnect not installed. WhatsApp features are disabled. Run: npm install @wppconnect-team/wppconnect');
    return null;
  }
};

/**
 * Create or retrieve a WPPConnect session for a property.
 */
const getSession = async (sessionId) => {
  if (sessions[sessionId]) return sessions[sessionId];

  const wpp = await initWPP();
  if (!wpp) return null;

  const client = await wpp.create({
    session: sessionId,
    catchQR: (base64Qr, asciiQR) => {
      // Store QR for frontend retrieval
      sessions[`${sessionId}_qr`] = base64Qr;
      console.log(`📱 QR Code generated for session: ${sessionId}`);
    },
    statusFind: (statusSession, session) => {
      console.log(`WhatsApp session [${session}]: ${statusSession}`);
      if (statusSession === 'inChat' || statusSession === 'isLogged') {
        sessions[`${sessionId}_status`] = 'connected';
        sessions[`${sessionId}_qr`] = null;
      }
    },
    headless: true,
    devtools: false,
    useChrome: false,
    debug: false,
    logQR: false,
    browserWS: '',
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    puppeteerOptions: {},
    folderNameToken: path.join(process.cwd(), 'wpp_tokens'),
    mkdirFolderToken: '',
    waitForLogin: false,
    autoClose: 0
  });

  sessions[sessionId] = client;
  sessions[`${sessionId}_status`] = 'connected';
  return client;
};

/**
 * Get QR code for a session (base64 image).
 */
const getQRCode = (sessionId) => {
  return sessions[`${sessionId}_qr`] || null;
};

/**
 * Get session connection status.
 */
const getSessionStatus = (sessionId) => {
  if (sessions[`${sessionId}_status`] === 'connected') return 'connected';
  if (sessions[`${sessionId}_qr`]) return 'waiting_qr';
  return 'disconnected';
};

/**
 * Send a WhatsApp message to a single number.
 */
const sendMessage = async (sessionId, phoneNumber, message) => {
  const client = await getSession(sessionId);
  if (!client) return { success: false, error: 'WPPConnect not available.' };

  // Format: 91XXXXXXXXXX@c.us
  const chatId = phoneNumber.replace(/\D/g, '').replace(/^0/, '91') + '@c.us';
  await client.sendText(chatId, message);
  return { success: true };
};

/**
 * Send bulk WhatsApp promotions.
 */
const sendBulkPromotion = async (propertyId, message, recipients, sentBy) => {
  const property = await Property.findByPk(propertyId);
  if (!property) throw { statusCode: 404, message: 'Property not found.' };

  const config = await SystemConfig.findByPk(1);
  const usePortalSession = config?.whatsapp_mode === 'portal';

  const sessionId = usePortalSession
    ? (config?.portal_whatsapp_session || 'portal_session')
    : (property.whatsapp_session_id || `property_${propertyId}`);

  const log = await WhatsappLog.create({
    property_id: propertyId,
    sender_type: usePortalSession ? 'portal' : 'property',
    message,
    recipient_count: recipients.length,
    recipient_list: recipients,
    sent_by: sentBy,
    status: 'pending'
  });

  // Send in background
  (async () => {
    const errors = [];
    let successCount = 0;

    for (const phone of recipients) {
      try {
        await sendMessage(sessionId, phone, message);
        successCount++;
        await new Promise(r => setTimeout(r, 1000)); // 1s delay between messages
      } catch (err) {
        errors.push({ phone, error: err.message });
      }
    }

    const status = errors.length === 0 ? 'sent'
      : successCount === 0 ? 'failed' : 'partial';

    await log.update({ status, error_log: errors, sent_at: new Date() });
    console.log(`📱 WhatsApp bulk: ${successCount}/${recipients.length} sent`);
  })();

  return { success: true, log_id: log.id, message: `Sending to ${recipients.length} recipients...` };
};

/**
 * Disconnect a session.
 */
const disconnectSession = async (sessionId) => {
  const client = sessions[sessionId];
  if (client) {
    await client.close();
    delete sessions[sessionId];
    delete sessions[`${sessionId}_qr`];
    delete sessions[`${sessionId}_status`];
  }
};

module.exports = { getSession, getQRCode, getSessionStatus, sendMessage, sendBulkPromotion, disconnectSession };
