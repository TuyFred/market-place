import {
  getAllSettings,
  updatePaymentSettings,
  updateSetting
} from '../services/settings.service.js';
import { supabaseAdmin as supabase } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export async function getSettingsHandler(request, reply) {
  try {
    const settings = await getAllSettings();
    return sendSuccess(reply, 200, {
      hero_video_url: settings.hero_video_url || '',
      payment: {
        bankName: settings.payment_bank_name || '',
        bankAccount: settings.payment_bank_account || '',
        bankAccountName: settings.payment_bank_account_name || '',
        mobileNumber: settings.payment_mobile_number || '',
        mobileName: settings.payment_mobile_name || '',
        paypalEmail: settings.payment_paypal_email || '',
        supportPhone: settings.payment_support_phone || '',
        instructions: settings.payment_instructions || ''
      }
    });
  } catch {
    return sendError(reply, 500, 'Error fetching settings');
  }
}

export async function updatePaymentSettingsHandler(request, reply) {
  try {
    const body = request.body || {};
    const mapped = {
      payment_bank_name: body.bankName,
      payment_bank_account: body.bankAccount,
      payment_bank_account_name: body.bankAccountName,
      payment_mobile_number: body.mobileNumber,
      payment_mobile_name: body.mobileName,
      payment_paypal_email: body.paypalEmail,
      payment_support_phone: body.supportPhone,
      payment_instructions: body.instructions
    };
    const settings = await updatePaymentSettings(mapped);
    return sendSuccess(reply, 200, {
      hero_video_url: settings.hero_video_url || '',
      payment: {
        bankName: settings.payment_bank_name || '',
        bankAccount: settings.payment_bank_account || '',
        bankAccountName: settings.payment_bank_account_name || '',
        mobileNumber: settings.payment_mobile_number || '',
        mobileName: settings.payment_mobile_name || '',
        paypalEmail: settings.payment_paypal_email || '',
        supportPhone: settings.payment_support_phone || '',
        instructions: settings.payment_instructions || ''
      }
    });
  } catch (err) {
    return sendError(reply, 400, err.message || 'Could not save payment settings');
  }
}

export async function uploadHeroVideoHandler(request, reply) {
  try {
    const file = await request.file();
    if (!file) return sendError(reply, 400, 'No file uploaded');

    const ext = file.filename.split('.').pop();
    const uniqueName = `hero-video-${uuidv4()}.${ext}`;

    const { error } = await supabase.storage.from('hero-videos').upload(uniqueName, file.file, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: true
    });

    if (error) throw error;

    const {
      data: { publicUrl }
    } = supabase.storage.from('hero-videos').getPublicUrl(uniqueName);

    await updateSetting('hero_video_url', publicUrl);

    return sendSuccess(reply, 200, { url: publicUrl });
  } catch (err) {
    console.error('Video upload error:', err);
    return sendError(reply, 500, err.message || 'Error uploading video');
  }
}
