"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("./client");
const models_1 = require("./models");
dotenv_1.default.config();
async function seed() {
    await (0, client_1.connectDB)();
    try {
        // Seed admin user
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const email = process.env.ADMIN_EMAIL || 'admin@satyalok.in';
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        await models_1.AdminUser.findOneAndUpdate({ username }, { username, passwordHash, email }, { upsert: true, new: true });
        console.log(`Admin user "${username}" seeded`);
        // Seed default portal configuration
        const existing = await models_1.PortalConfig.findOne();
        if (!existing) {
            const openingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const closingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await models_1.PortalConfig.create({ openingDate, closingDate, manualStatus: 'AUTO' });
            console.log('Default portal configuration seeded');
        }
        console.log('Seed completed successfully');
    }
    finally {
        await (0, client_1.disconnectDB)();
    }
}
seed().catch(console.error);
//# sourceMappingURL=seed.js.map