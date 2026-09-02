const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const db = require('./database');
const couponGen = require('./couponGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health Check Route - So users know the server is actually running
app.get('/', (req, res) => {
    res.send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">🚀 Royal Crockery Backend is Running!</h1><p style="text-align: center; font-family: sans-serif;">The server is alive. Please open the frontend HTML file to use the wheel.</p>');
});

/**
 * Utility: Weighted random selection
 */
function getWeightedPrizeIndex() {
    const totalWeight = config.PRIZES.reduce((acc, prize) => acc + prize.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < config.PRIZES.length; i++) {
        if (random < config.PRIZES[i].weight) {
            return i;
        }
        random -= config.PRIZES[i].weight;
    }
    return config.PRIZES.length - 1;
}

/**
 * Middleware: Ensure user has a unique tracking ID
 */
app.use((req, res, next) => {
    let userId = req.cookies.wheel_user_id;
    if (!userId) {
        userId = uuidv4();
        res.cookie('wheel_user_id', userId, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            sameSite: 'lax'
        });
    }
    req.userId = userId;
    next();
});

// Endpoint: Check if user is eligible to spin
app.get('/api/status', (req, res) => {
    const spin = db.hasUserSpun(req.userId);
    if (spin) {
        return res.json({
            eligible: false,
            previousPrizeIndex: spin.prize_index,
            couponId: spin.coupon_id
        });
    }
    res.json({ eligible: true });
});

// Endpoint: Execute spin
app.post('/api/spin', (req, res) => {
    const userId = req.userId;

    // 1. Verify eligibility (Double-check on server)
    if (db.hasUserSpun(userId)) {
        return res.status(403).json({ error: "You have already spun the wheel for this campaign." });
    }

    // 2. Determine prize using weighted probabilities
    const prizeIndex = getWeightedPrizeIndex();
    const prize = config.PRIZES[prizeIndex];

    // 3. Generate coupon if applicable
    const coupon = couponGen.createCoupon(userId, prizeIndex);
    let couponId = null;

    if (coupon) {
        db.saveCoupon(coupon);
        couponId = coupon.id;
    }

    // 4. Permanently record the spin
    db.recordSpin(userId, prizeIndex, couponId);

    // 5. Return result to frontend
    res.json({
        prizeIndex: prizeIndex,
        prizeLabel: prize.label,
        couponCode: coupon ? coupon.code : null,
        expiryAt: coupon ? coupon.expiryAt : null,
        campaignName: config.CAMPAIGN.NAME
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Discount Wheel Backend running at http://localhost:${PORT}`);
});
