import { getSetting, updateSetting } from '../services/settings.service.js';
import { supabaseAdmin as supabase } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export async function getSettingsHandler(request, reply) {
    try {
        const heroVideoUrl = await getSetting('hero_video_url');
        return sendSuccess(reply, 200, { hero_video_url: heroVideoUrl || '' });
    } catch (err) {
        return sendError(reply, 500, 'Error fetching settings');
    }
}

export async function uploadHeroVideoHandler(request, reply) {
    try {
        const file = await request.file();
        if (!file) return sendError(reply, 400, 'No file uploaded');

        const ext = file.filename.split('.').pop();
        const uniqueName = `hero-video-${uuidv4()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('hero-videos')
            .upload(uniqueName, file.file, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('hero-videos')
            .getPublicUrl(uniqueName);

        await updateSetting('hero_video_url', publicUrl);

        return sendSuccess(reply, 200, { url: publicUrl });
    } catch (err) {
        console.error('Video upload error:', err);
        return sendError(reply, 500, err.message || 'Error uploading video');
    }
}
