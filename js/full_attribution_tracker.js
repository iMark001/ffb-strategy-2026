/**
 * Fulfillment-Box Universal Multi-Touch Attribution Tracker
 * Tracks: Organic Search, Paid (UTM + GCLID/FBCLID), AI Search (ChatGPT/Perplexity), Referrals, Direct
 * Models: First-Touch + Last-Touch
 * Form injection & GTM DataLayer sync
 */
(function() {
    'use strict';

    const STORAGE_KEY_FIRST = 'ffb_attrib_first_touch';
    const STORAGE_KEY_LAST = 'ffb_attrib_last_touch';
    const COOKIE_EXPIRY_DAYS = 90;

    function getQueryParams() {
        const params = {};
        const search = window.location.search.substring(1);
        if (search) {
            search.split('&').forEach(function(part) {
                const item = part.split('=');
                if (item[0]) {
                    params[decodeURIComponent(item[0])] = decodeURIComponent(item[1] || '');
                }
            });
        }
        return params;
    }

    function parseReferrer(refUrl) {
        if (!refUrl) return { channel: 'Direct', source: '(direct)', medium: '(none)' };
        
        try {
            const parsed = new URL(refUrl);
            const host = parsed.hostname.toLowerCase();
            const search = parsed.search;

            // Internal referral check
            if (host.includes(window.location.hostname.toLowerCase())) {
                return null; // Don't overwrite external referrer with internal navigation
            }

            // AI Search Engines
            if (host.includes('chatgpt.com') || host.includes('openai.com')) {
                return { channel: 'AI Assistant', source: 'ChatGPT', medium: 'ai_search' };
            }
            if (host.includes('perplexity.ai')) {
                return { channel: 'AI Assistant', source: 'Perplexity', medium: 'ai_search' };
            }
            if (host.includes('claude.ai')) {
                return { channel: 'AI Assistant', source: 'Claude', medium: 'ai_search' };
            }
            if (host.includes('gemini.google.com')) {
                return { channel: 'AI Assistant', source: 'Gemini', medium: 'ai_search' };
            }

            // Organic Search Engines
            if (host.includes('google.')) {
                return { channel: 'Organic Search', source: 'Google', medium: 'organic' };
            }
            if (host.includes('bing.com')) {
                return { channel: 'Organic Search', source: 'Bing', medium: 'organic' };
            }
            if (host.includes('yandex.') || host.includes('ya.ru')) {
                return { channel: 'Organic Search', source: 'Yandex', medium: 'organic' };
            }
            if (host.includes('yahoo.com')) {
                return { channel: 'Organic Search', source: 'Yahoo', medium: 'organic' };
            }
            if (host.includes('duckduckgo.com')) {
                return { channel: 'Organic Search', source: 'DuckDuckGo', medium: 'organic' };
            }
            if (host.includes('ecosia.org')) {
                return { channel: 'Organic Search', source: 'Ecosia', medium: 'organic' };
            }

            // Social Media Organic
            if (host.includes('facebook.com') || host.includes('fb.com')) {
                return { channel: 'Organic Social', source: 'Facebook', medium: 'social' };
            }
            if (host.includes('instagram.com')) {
                return { channel: 'Organic Social', source: 'Instagram', medium: 'social' };
            }
            if (host.includes('linkedin.com')) {
                return { channel: 'Organic Social', source: 'LinkedIn', medium: 'social' };
            }
            if (host.includes('t.me') || host.includes('telegram.org')) {
                return { channel: 'Organic Social', source: 'Telegram', medium: 'messenger' };
            }
            if (host.includes('youtube.com')) {
                return { channel: 'Organic Video', source: 'YouTube', medium: 'social' };
            }

            // Standard Referral
            return { channel: 'Referral', source: host, medium: 'referral' };
        } catch(e) {
            return { channel: 'Referral', source: refUrl.substring(0, 100), medium: 'referral' };
        }
    }

    function determineAttribution() {
        const q = getQueryParams();
        const ref = document.referrer;
        const now = new Date().toISOString();
        const currentUrl = window.location.href;

        let channel = 'Direct';
        let source = '(direct)';
        let medium = '(none)';
        let campaign = '(none)';
        let content = '';
        let term = '';
        let clickId = q.gclid || q.fbclid || q.msclkid || q.ttclid || q.wbraid || q.gbraid || '';

        // 1. Paid Traffic Detection (UTM or Click IDs)
        if (q.utm_source || q.utm_medium || q.utm_campaign || clickId) {
            source = q.utm_source || (q.gclid ? 'google' : (q.fbclid ? 'facebook' : 'paid_ad'));
            medium = q.utm_medium || (clickId ? 'cpc' : 'paid');
            campaign = q.utm_campaign || '(not_set)';
            content = q.utm_content || '';
            term = q.utm_term || '';
            
            if (medium === 'cpc' || medium === 'ppc' || medium === 'paidsearch') {
                channel = 'Paid Search';
            } else if (medium === 'social' || medium === 'paidsocial' || q.fbclid) {
                channel = 'Paid Social';
            } else {
                channel = 'Paid Other';
            }
        } 
        // 2. Referrer / Organic Detection
        else if (ref) {
            const parsedRef = parseReferrer(ref);
            if (parsedRef) {
                channel = parsedRef.channel;
                source = parsedRef.source;
                medium = parsedRef.medium;
            }
        }

        const touchpoint = {
            channel: channel,
            source: source,
            medium: medium,
            campaign: campaign,
            content: content,
            term: term,
            click_id: clickId,
            landing_url: currentUrl,
            referrer: ref,
            timestamp: now
        };

        // Save First-Touch (immutable once set)
        let firstTouch = null;
        try {
            const storedFirst = localStorage.getItem(STORAGE_KEY_FIRST);
            if (storedFirst) {
                firstTouch = JSON.parse(storedFirst);
            } else {
                firstTouch = touchpoint;
                localStorage.setItem(STORAGE_KEY_FIRST, JSON.stringify(firstTouch));
            }
        } catch(e) {
            firstTouch = touchpoint;
        }

        // Save Last-Touch (updated on new session / external touchpoint)
        try {
            localStorage.setItem(STORAGE_KEY_LAST, JSON.stringify(touchpoint));
        } catch(e) {}

        return {
            first: firstTouch,
            last: touchpoint
        };
    }

    function injectIntoForms(data) {
        const fields = {
            // First touch
            'first_touch_channel': data.first.channel,
            'first_touch_source': data.first.source,
            'first_touch_medium': data.first.medium,
            'first_touch_campaign': data.first.campaign,
            'first_touch_landing': data.first.landing_url,
            'first_touch_date': data.first.timestamp,
            // Last touch / Current
            'utm_source': data.last.source,
            'utm_medium': data.last.medium,
            'utm_campaign': data.last.campaign,
            'utm_content': data.last.content,
            'utm_term': data.last.term,
            'last_touch_channel': data.last.channel,
            'last_click_id': data.last.click_id,
            'last_referrer': data.last.referrer,
            'last_landing_url': data.last.landing_url,
            'submission_url': window.location.href
        };

        document.querySelectorAll('form').forEach(function(form) {
            Object.keys(fields).forEach(function(fieldName) {
                const val = fields[fieldName];
                if (val !== undefined && val !== null && val !== '') {
                    let input = form.querySelector('input[name="' + fieldName + '"]');
                    if (!input) {
                        input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = fieldName;
                        form.appendChild(input);
                    }
                    input.value = val;
                }
            });
        });
    }

    // Initialize Tracker
    const attribData = determineAttribution();

    // Push to Google Tag Manager dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'ffb_attribution_ready',
        attribution_first_touch: attribData.first,
        attribution_last_touch: attribData.last
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            injectIntoForms(attribData);
        });
    } else {
        injectIntoForms(attribData);
    }

    // Expose API globally
    window.FFB_Attribution = attribData;
})();
