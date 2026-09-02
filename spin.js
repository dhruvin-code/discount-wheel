const { getStore } = require('@netlify/blobs');
const cookie = require('cookie');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

function getWeightedPrizeIndex() {
    const totalWeight = config.PRIZES.reduce((acc, prize) => acc + prize.weight, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < config.PRIZES.length; i++) {
        if (random < config.PRIZES[i].weight) return i;
        random -= config.PRIZES[i].weight;
    }
    return config.PRIZES.length - 1;
}

function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const cookies = cookie.parse(event.headers.cookie || '');
    const userId = cookies.wheel_user_id;

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "User ID not found. Please refresh the page." })
        };
    }

    try {
        const store = getStore('spins');

        // 1. Verify eligibility
        const existingSpin = await store.get(`spin_${userId}`);
        if (existingSpin) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: "You have already spun the wheel!" })
            };
        }

        // 2. Determine prize
        const prizeIndex = getWeightedPrizeIndex();
        const prize = config.PRIZES[prizeIndex];

        // 3. Generate coupon
        let couponCode = null;
        let expiryAt = null;

        if (prize.value > 0) {
            couponCode = `${config.CAMPAIGN.COUPON_PREFIX}-${generateRandomCode()}`;
            const date = new Date();
            date.setHours(date.getHours() + config.CAMPAIGN.EXPIRY_HOURS);
            expiryAt = date.toISOString();
        }

        // 4. Save result to Blobs permanently
        await store.set(`spin_${userId}`, {
            prizeIndex,
            couponCode,
            expiryAt,
            createdAt: new Date().toISOString()
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prizeIndex,
                prizeLabel: prize.label,
                couponCode,
                expiryAt,
                campaignName: config.CAMPAIGN.NAME
            })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
