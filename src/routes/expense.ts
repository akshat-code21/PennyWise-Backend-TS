import { Router, Request, Response } from "express";
import { z } from "zod";
import userMiddleWare from "../middlewares";
import { ExpenseModel } from "../models";
const expenseRouter = Router();
const expensePayloadSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount cannot exceed 1,000,000")
    .refine((val) => !isNaN(val), "Amount must be a valid number"),
  category: z
    .string()
    .min(1, "Category is required")
    .max(20, "Category name too long")
    .refine(
      (val) =>
        ["shopping", "health", "travel", "food", "entertainment"].includes(
          val.toLowerCase()
        ),
      "Invalid category"
    ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(100, "Description too long")
    .refine((val) => val.trim().length > 0, "Description cannot be empty")
    .refine(
      (val) => isNaN(Number(val)) === false && !/^\d+$/.test(val.trim()),
      "Description cannot be a number"
    )
    .refine(
      (val) => /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()]+$/.test(val),
      "Description contains invalid characters"
    ),
});
expenseRouter.get("/", userMiddleWare, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const expenses = await ExpenseModel.find({
      user: userId,
    });
    res.status(200).json({
      expenses: expenses,
      message: "expenses recorded",
    });
  } catch (e) {
    res.json({
      message: e,
    });
  }
});
expenseRouter.post(
  "/",
  userMiddleWare,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, category, description } = req.body;

      if (!amount || !category || !description) {
        res.status(400).json({
          message: "Amount, category, and description are required",
        });
        return;
      }

      const validated = expensePayloadSchema.safeParse(req.body);
      if (!validated.success) {
        res.status(400).json({
          message: validated.error.errors[0].message || "Invalid input",
        });
        return;
      }

      await ExpenseModel.create({
        amount,
        category: category.toLowerCase(),
        description,
        user: req.userId,
      });

      res.status(201).json({
        message: "expense added",
      });
    } catch (error: any) {
      console.error("Error adding expense:", error);
      res.status(500).json({
        message: "Failed to add expense",
      });
    }
  }
);
expenseRouter.put("/:id", userMiddleWare, async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const validated = expensePayloadSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        message: validated.error.message,
      });
      return;
    }
    const expenseId = req.params.id;
    const expense = await ExpenseModel.updateOne(
      {
        _id: expenseId,
        user: req.userId,
      },
      {
        amount,
        category,
        description,
      }
    );
    res.status(203).json({
      message: "expense changed",
      expense,
    });
  } catch (e) {
    res.json({
      message: e,
    });
  }
});
expenseRouter.delete("/:id", userMiddleWare, async (req, res) => {
  try {
    const expenseId = req.params.id;
    await ExpenseModel.deleteOne({
      _id: expenseId,
      user: req.userId,
    });
    res.status(200).json({
      message: "expense deleted",
    });
  } catch (e) {
    res.json({
      message: e,
    });
  }
});
export default expenseRouter;
