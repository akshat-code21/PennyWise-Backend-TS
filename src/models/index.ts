import { MONGO_URL } from "../config/config"
import mongoose from "mongoose"
mongoose.connect(`${MONGO_URL}`, {
}).then(() => {
    console.log("Successfully connected to MongoDB");
}).catch(error => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
});
const ExpenseSchema = new Schema({
  amount: Number,
  category: String,
  description: String,
  user: { type: ObjectId, ref: 'Users', required: true }
}, { timestamps: true });
const InsightsSchema = new Schema({
  user: { type: ObjectId, ref: 'Users', required: true },
  type: String,
  data: Object,
  generatedAt: { type: Date, default: Date.now }
});
export const UserModel = mongoose.model("Users", UserSchema);
export const ExpenseModel = mongoose.model("Expense", ExpenseSchema);
export const InsightsModel = mongoose.model("Insights", InsightsSchema);