const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));


// Ensure data file exists
async function initDataFile() {
    const exists = await fs.pathExists(DATA_FILE);
    if (!exists) {
        await fs.writeJson(DATA_FILE, { transactions: [] });
    }
}

// Read data
async function readData() {
    return await fs.readJson(DATA_FILE);
}

// Write data
async function writeData(data) {
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
}

// ➤ Add transaction (income/expense)
app.post("/add", async (req, res) => {
    const { type, amount, category, description } = req.body;

    if (!type || !amount) {
        return res.status(400).json({ error: "Type and amount required" });
    }

    const data = await readData();

    const newTransaction = {
        id: Date.now(),
        type, // income or expense
        amount: Number(amount),
        category: category || "general",
        description: description || "",
        date: new Date().toISOString()
    };

    data.transactions.push(newTransaction);
    await writeData(data);

    res.json({ message: "Transaction added", transaction: newTransaction });
});

// ➤ Get all transactions
app.get("/transactions", async (req, res) => {
    const data = await readData();
    res.json(data.transactions);
});

// ➤ Get balance
app.get("/balance", async (req, res) => {
    const data = await readData();

    let balance = 0;

    data.transactions.forEach(t => {
        if (t.type === "income") balance += t.amount;
        else balance -= t.amount;
    });

    res.json({ balance });
});

// ➤ Monthly summary
app.get("/summary", async (req, res) => {
    const data = await readData();

    const summary = {};

    data.transactions.forEach(t => {
        const month = t.date.slice(0, 7); // YYYY-MM

        if (!summary[month]) {
            summary[month] = { income: 0, expense: 0 };
        }

        if (t.type === "income") {
            summary[month].income += t.amount;
        } else {
            summary[month].expense += t.amount;
        }
    });

    res.json(summary);
});

// ➤ Delete transaction
app.delete("/delete/:id", async (req, res) => {
    const id = Number(req.params.id);
    const data = await readData();

    data.transactions = data.transactions.filter(t => t.id !== id);

    await writeData(data);

    res.json({ message: "Transaction deleted" });
});


// ➤ Home route
app.get("/", (req, res) => {
    res.send("💰 Budget Tracker API is running successfully!");
});
app.listen(PORT, "0.0.0.0", async () => {
    await initDataFile();
    console.log(`Server running on http://localhost:${PORT}`);
});
