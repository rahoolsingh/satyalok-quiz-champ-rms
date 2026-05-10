import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db/client";
import { portalRouter } from "./routes/portal";
import { registrationRouter } from "./routes/registration";
import { resultsRouter } from "./routes/results";
import { adminRouter } from "./routes/admin";
import { paymentRouter } from "./routes/payment";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/portal", portalRouter);
app.use("/api/registration", registrationRouter);
app.use("/api/results", resultsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payment", paymentRouter);

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
            app.listen(PORT, () =>
                console.log(`Quiz Champ API running on port ${PORT}`),
            );
        })
        .catch((err) => {
            console.error("Failed to connect to MongoDB:", err);
            process.exit(1);
        });
}

export { app };
