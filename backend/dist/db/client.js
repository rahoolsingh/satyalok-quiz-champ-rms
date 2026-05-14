"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz_champ';
    await mongoose_1.default.connect(uri);
    console.log('MongoDB connected');
}
async function disconnectDB() {
    await mongoose_1.default.disconnect();
}
//# sourceMappingURL=client.js.map