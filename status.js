const { getStore } = require('@netlify/blobs');
const cookie = require('cookie');

exports.handler = async (event, context) => {
    const cookies = cookie.parse(event.headers.cookie || '');
    let userId = cookies.wheel_user_id;

    // If no userId, we'll return eligible: true but the frontend will handle the cookie
    // Actually, the function can set the cookie too.
    if (!userId) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eligible: true })
        };
    }

    try {
        const store = getStore('spins');
        const spin = await store.get(`spin_${userId}`);

        if (spin) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eligible: false,
                    previousPrizeIndex: spin.prizeIndex
                })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eligible: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
