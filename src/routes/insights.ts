import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import userMiddleWare from "../middlewares";
import { ExpenseModel } from "../models";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

interface Expenses {
  amount: number;
  createdAt: Date;
  category: string;
}

interface AnalysisData {
  total: number;
  categoryPercentages: { [key: string]: string };
  monthlyTotals: { [key: string]: number };
  timespan: {
    start: Date;
    end: Date;
  };
}

const insightsRouter = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});
insightsRouter.get(
  "/ai-analysis",
  userMiddleWare,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const expenses = await ExpenseModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(100);

      if (!expenses.length) {
        res.status(404).json({
          message: "No expenses found",
        });
        return;
      }
      const data = prepareExpenseData(expenses as Expenses[]);

      const prompt = generateAnalysisPrompt(data);

      try {
        const chat = model.startChat({
          history: [],
        });

        const result = await chat.sendMessage(prompt);
        const text = result.response.text();

        res.json({
          insights: text,
          expenseData: data,
        });
      } catch (aiError: any) {
        console.error("AI Generation Error:", aiError);
        res.status(500).json({
          message: "Failed to generate AI insights",
          error: aiError.message,
        });
      }
    } catch (error: any) {
      console.error("Error in insights route:", error);
      res.status(500).json({
        message: "Failed to process insights request",
        error: error.message,
      });
    }
  }
);

function prepareExpenseData(expenses: Expenses[]) {
  const monthlyTotals: { [key: string]: number } = {};
  expenses.forEach((exp) => {
    const month = new Date(exp.createdAt).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
  });

  const categoryTotals = expenses.reduce(
    (acc: { [key: string]: number }, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {}
  );

  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const categoryPercentages: { [key: string]: string } = {};
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    categoryPercentages[category] = ((amount / total) * 100).toFixed(1);
  });

  return {
    total,
    categoryPercentages,
    monthlyTotals,
    timespan: {
      start: expenses[expenses.length - 1].createdAt,
      end: expenses[0].createdAt,
    },
  };
}

function generateAnalysisPrompt(data: AnalysisData) {
  return `As a financial advisor, analyze this expense data and provide detailed insights:

Total Spending: ₹${data.total}
Time Period: ${new Date(
    data.timespan.start
  ).toLocaleDateString()} to ${new Date(data.timespan.end).toLocaleDateString()}

Category Breakdown (% of total):
${Object.entries(data.categoryPercentages)
  .map(([category, percentage]) => `- ${category}: ${percentage}%`)
  .join("\n")}

Monthly Spending:
${Object.entries(data.monthlyTotals)
  .map(([month, amount]) => `- ${month}: ₹${amount}`)
  .join("\n")}

Please provide:
1. Key Observations:
   - Identify the main spending categories
   - Note any unusual patterns or spikes
   - Compare monthly variations

2. Budget Optimization:
   - Suggest specific areas to reduce spending
   - Recommend realistic saving targets
   - Propose category-wise budget allocations

3. Risk Analysis:
   - Highlight potential overspending categories
   - Identify unsustainable patterns
   - Note any concerning trends

4. Positive Habits:
   - Recognize good financial decisions
   - Point out well-managed categories
   - Suggest habits to maintain

5. Action Items:
   - List 3-4 specific, actionable steps
   - Prioritize immediate changes
   - Suggest long-term strategies

Please format the response in clear sections with bullet points where appropriate.`;
}

insightsRouter.get("/statistics", userMiddleWare, async (req, res) => {
  try {
    const userId = req.userId;
    const expenses = await ExpenseModel.find({ user: userId });

    if (!expenses.length) {
      res.status(404).json({
        message: "No expenses found",
      });
      return;
    }

    const currentDate = new Date();
    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return (
        expenseDate.getMonth() === currentDate.getMonth() &&
        expenseDate.getFullYear() === currentDate.getFullYear()
      );
    });

    const monthlyTotalSpending = currentMonthExpenses.reduce(
      (sum, expense) => sum + (expense.amount ?? 0),
      0
    );

    const categorySpending = expenses.reduce(
      (acc: { [key: string]: number }, expense) => {
        const category = expense.category ?? "uncategorized";
        acc[category] = (acc[category] || 0) + (expense.amount ?? 0);
        return acc;
      },
      {}
    );

    const monthlySpending = expenses.reduce((acc, expense) => {
      const month = new Date(expense.createdAt).toLocaleString("default", {
        month: "long",
      });
      acc[month] = (acc[month] || 0) + (expense.amount ?? 0);
      return acc;
    }, {} as { [key: string]: number });

    const sortedExpenses = [...expenses].sort(
      (a, b) => (b.amount ?? 0) - (a.amount ?? 0)
    );
    const highestExpense = sortedExpenses[0];
    const lowestExpense = sortedExpenses[sortedExpenses.length - 1];

    res.json({
      monthlyTotalSpending,
      categorySpending,
      monthlySpending,
      highestExpense,
      lowestExpense,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({
      message: "Failed to generate insights",
    });
  }
});
export default insightsRouter;
