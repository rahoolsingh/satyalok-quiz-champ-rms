import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./db/client";
import { portalRouter } from "./routes/portal";
import { registrationRouter } from "./routes/registration";
import { resultsRouter } from "./routes/results";
import { adminRouter } from "./routes/admin";
import { paymentRouter } from "./routes/payment";
import { otpRouter } from "./routes/otp";
import { profileRouter } from "./routes/profile";
import { faqRouter } from "./routes/faq";
import { mcqRouter } from "./routes/mcq";
import { testAdmitCardRouter } from "./routes/testAdmitCard";
import { startPaymentReminderScheduler } from "./services/paymentReminder";
import { startPaymentCron } from "./services/paymentCron";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true, // Allow cookies
    }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public/assets directory (in all environments)
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
console.log('✅ Static assets served from /assets');

// Serve other static files from public directory (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  console.log('✅ Static files served from /public');
}

app.use("/api/portal", portalRouter);
app.use("/api/otp", otpRouter);
app.use("/api/registration", registrationRouter);
app.use("/api/profile", profileRouter);
app.use("/api/results", resultsRouter);
app.use("/api/faq", faqRouter);
app.use("/api/mcq", mcqRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payment", paymentRouter);

// Test routes (only in development)
if (process.env.NODE_ENV !== "production") {
    app.use("/api/test", testAdmitCardRouter);
    console.log("✅ Test routes enabled at /api/test");
    console.log("✅ Test UI available at http://localhost:" + PORT + "/test-admit-card.html");
}

app.get("/health", (_req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.use(
    (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
    ) => {
        console.error(err.stack);
        res.status(500).json({ error: "Internal server error" });
    },
);

if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Quiz Champ API running on port ${PORT}`);
                
                // Start payment reminder scheduler
                startPaymentReminderScheduler();

                // Start payment verification cron
                startPaymentCron();
            });
        })
        .catch((err) => {
            console.error("Failed to connect to MongoDB:", err);
            process.exit(1);
        });
}

export { app };
