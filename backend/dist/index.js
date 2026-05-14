"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const client_1 = require("./db/client");
const portal_1 = require("./routes/portal");
const registration_1 = require("./routes/registration");
const results_1 = require("./routes/results");
const admin_1 = require("./routes/admin");
const payment_1 = require("./routes/payment");
const otp_1 = require("./routes/otp");
const profile_1 = require("./routes/profile");
const testAdmitCard_1 = require("./routes/testAdmitCard");
const paymentReminder_1 = require("./services/paymentReminder");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true, // Allow cookies
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static assets from public/assets directory (in all environments)
app.use('/assets', express_1.default.static(path_1.default.join(__dirname, '../public/assets')));
console.log('✅ Static assets served from /assets');
// Serve other static files from public directory (only in development)
if (process.env.NODE_ENV !== 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    console.log('✅ Static files served from /public');
}
app.use("/api/portal", portal_1.portalRouter);
app.use("/api/otp", otp_1.otpRouter);
app.use("/api/registration", registration_1.registrationRouter);
app.use("/api/profile", profile_1.profileRouter);
app.use("/api/results", results_1.resultsRouter);
app.use("/api/admin", admin_1.adminRouter);
app.use("/api/payment", payment_1.paymentRouter);
// Test routes (only in development)
if (process.env.NODE_ENV !== "production") {
    app.use("/api/test", testAdmitCard_1.testAdmitCardRouter);
    console.log("✅ Test routes enabled at /api/test");
    console.log("✅ Test UI available at http://localhost:" + PORT + "/test-admit-card.html");
}
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
});
if (require.main === module) {
    (0, client_1.connectDB)()
        .then(() => {
        app.listen(PORT, () => {
            console.log(`Quiz Champ API running on port ${PORT}`);
            // Start payment reminder scheduler
            (0, paymentReminder_1.startPaymentReminderScheduler)();
        });
    })
        .catch((err) => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map