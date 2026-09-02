const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../database/db.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ spins: [], coupons: [] }, null, 2));
}

function readDB() {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    // Check if a user has already spun the wheel
    hasUserSpun: (userId) => {
        const db = readDB();
        return db.spins.find(s => s.user_id === userId);
    },

    // Record a spin and its associated coupon
    recordSpin: (userId, prizeIndex, couponId) => {
        const db = readDB();
        const newSpin = {
            id: Date.now(),
            user_id: userId,
            prize_index: prizeIndex,
            coupon_id: couponId,
            created_at: new Date().toISOString()
        };
        db.spins.push(newSpin);
        writeDB(db);
        return newSpin;
    },

    // Save a generated coupon
    saveCoupon: (coupon) => {
        const db = readDB();
        db.coupons.push(coupon);
        writeDB(db);
        return coupon;
    }
};
