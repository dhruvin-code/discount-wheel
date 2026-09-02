// Use relative paths for Netlify Functions
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : '/.netlify/functions';

const PRIZES = [
    "10% OFF",
    "20% OFF",
    "30% OFF",
    "40% OFF",
    "50% OFF",
    "BETTER LUCK NEXT TIME"
];

const COLORS = [
    "#ffffff", "#f1f5f9", "#ffffff", "#f1f5f9", "#ffffff", "#f1f5f9"
];

const TEXT_COLORS = [
    "#4f46e5", "#4f46e5", "#4f46e5", "#4f46e5", "#4f46e5", "#64748b"
];

class DiscountWheel {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.btn = document.getElementById('spinButton');
        this.modal = document.getElementById('resultModal');
        this.prizeDisplay = document.getElementById('prizeDisplay');
        this.couponCode = document.getElementById('couponCode');
        this.expiryText = document.getElementById('expiryText');
        this.closeBtn = document.getElementById('closeModal');

        this.rotation = 0;
        this.isSpinning = false;

        this.init();
    }

    init() {
        this.drawWheel();
        this.btn.addEventListener('click', () => this.handleSpin());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.checkStatus();
    }

    drawWheel() {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width / 2 - 20;
        const sliceAngle = (2 * Math.PI) / PRIZES.length;

        this.ctx.clearRect(0, 0, width, height);

        PRIZES.forEach((text, i) => {
            const angle = i * sliceAngle;

            // Draw Slice
            this.ctx.beginPath();
            this.ctx.fillStyle = COLORS[i];
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw Border
            this.ctx.strokeStyle = '#e2e8f0';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw Text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(angle + sliceAngle / 2);
            this.ctx.textAlign = "right";
            this.ctx.fillStyle = TEXT_COLORS[i];
            this.ctx.font = "bold 18px Inter";
            this.ctx.fillText(text, radius - 30, 10);
            this.ctx.restore();
        });

        // Center Circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    async checkStatus() {
        try {
            // Ensure user has a tracking ID before checking status
            this.ensureUserId();

            const res = await fetch(`${API_BASE}/status`, { credentials: 'include' });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();

            if (data.eligible === false) {
                this.btn.disabled = true;
                this.btn.innerText = "ALREADY SPUN";
            }
        } catch (e) {
            console.error("Status check failed", e);
        }
    }

    ensureUserId() {
        if (!document.cookie.includes('wheel_user_id')) {
            const id = crypto.randomUUID();
            document.cookie = `wheel_user_id=${id}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
        }
    }

    async handleSpin() {
        if (this.isSpinning) return;

        this.isSpinning = true;
        this.btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/spin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server Error: ${res.status}`);
            }
            const data = await res.json();

            this.animateWheel(data.prizeIndex, data);
        } catch (e) {
            console.error("Spin Error:", e);
            alert(`Something went wrong: ${e.message}\n\nMake sure the backend server is running at ${API_BASE}`);
            this.isSpinning = false;
            this.btn.disabled = false;
        }
    }

    animateWheel(prizeIndex, resultData) {
        const rotations = 5 + Math.floor(Math.random() * 3); // 5-8 spins

        // Calculate final angle to align prizeIndex with the pointer at the top (270 deg)
        // Base: 240 - (index * 60)
        const finalAngle = (rotations * 360) + (240 - (prizeIndex * 60));

        this.rotation = finalAngle;
        this.canvas.style.transform = `rotate(${this.rotation}deg)`;

        // Show result after animation ends (5s)
        setTimeout(() => {
            this.showResult(resultData);
        }, 5100);
    }

    showResult(data) {
        this.prizeDisplay.innerText = data.prizeLabel;
        this.couponCode.innerText = data.couponCode || "NO COUPON";

        if (data.couponCode) {
            const expiry = new Date(data.expiryAt);
            this.expiryText.innerText = `Expires on ${expiry.toLocaleString()}`;
        } else {
            this.expiryText.innerText = "Better luck next time!";
            this.couponCode.parentElement.style.display = 'none';
        }

        this.modal.setAttribute('aria-hidden', 'false');
    }

    closeModal() {
        this.modal.setAttribute('aria-hidden', 'true');
    }
}

// Initialize the wheel when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new DiscountWheel();
});
