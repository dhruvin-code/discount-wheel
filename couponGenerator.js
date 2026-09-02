const { v4: uuidv4 } = require('uuid');
const config = require('./config');

function generateRandomCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = {
    createCoupon: (userId, prizeIndex) => {
        const prize = config.PRIZES[prizeIndex];

        // If the prize is "Better Luck Next Time", no coupon is generated
        if (prize.value === 0) return null;

        const couponId = uuidv4();
        const code = `${config.CAMPAIGN.COUPON_PREFIX}-${generateRandomCode()}`;

        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + config.CAMPAIGN.EXPIRY_HOURS);

        return {
            id: couponId,
            code: code,
            discountValue: prize.value,
            userId: userId,
            campaignId: config.CAMPAIGN.ID,
            expiryAt: expiryDate.toISOString(),
            createdAt: new Date().toISOString()
        };
    }
};
