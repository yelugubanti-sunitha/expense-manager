// Select Elements

const form = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const incomeInput = document.getElementById("income");
const expenseList = document.getElementById("expense-list");
const totalAmount = document.getElementById("total-amount");
const exportCsvBtn = document.getElementById("export-csv-btn");
const budgetInput = document.getElementById("budget-input");
const setBudgetBtn = document.getElementById("set-budget-btn");
const budgetAmountDisplay = document.getElementById("budget-amount");
const remainingBudgetDisplay = document.getElementById("remaining-budget");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let expenseChart;
let incomeExpenseChart;
let editIndex = -1;
let budget = Number(localStorage.getItem("budget")) || 0;


// Utility Functions
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function saveBudget() {
    localStorage.setItem("budget", budget);
}

// Form Submit (Add / Update)


form.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const income = Number(incomeInput.value) || 0;
    const category = categoryInput.value;

    if (title === "" || (amount <= 0 && income <= 0)) {
    alert("Please enter valid details");
    return;
}

    const expense = {
        title,
        amount,
        income,
        category,
        date: dateInput.value
    };

    if (editIndex === -1) {
        expenses.push(expense);
    } else {
        expenses[editIndex] = expense;
        editIndex = -1;
        form.querySelector("button").textContent = "Add";
    }

    saveExpenses();

    renderExpenses();
    updateTotal();
    updateChart();
    form.reset();
});


// Render Expenses

function renderExpenses() {

    expenseList.innerHTML = "";

    const noMessage = document.getElementById("no-expense-message");

    if (expenses.length === 0) {
        noMessage.style.display = "block";
        return;
    } else {
        noMessage.style.display = "none";
    }

    for (let i = 0; i < expenses.length; i++) {
        displayExpense(expenses[i], i);
    }
}


// Display Single Expense

function displayExpense(expense, index) {

    const card = document.createElement("div");
    card.className = "col-md-4 mb-3";

    card.innerHTML = `
        <div class="card p-3 shadow-sm h-100">
            <h5>${expense.title}</h5>
            <p><strong>Date:</strong> ${expense.date}</p>
            <p><strong>Category:</strong> ${expense.category}</p>
           <p class="expense-amount"><strong>Amount:</strong> ₹${expense.amount.toLocaleString("en-IN")}</p>
            <button class="btn btn-sm btn-warning mt-2 edit-btn">Edit</button>
            <button class="btn btn-sm btn-danger mt-2 ms-2 delete-btn">Delete</button>
        </div>
    `;

    card.querySelector(".edit-btn").addEventListener("click", function () {
        editExpense(index);
    });

    card.querySelector(".delete-btn").addEventListener("click", function () {
        deleteExpense(index);
    });

    expenseList.appendChild(card);
}



function editExpense(index) {

    const expense = expenses[index];

    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    incomeInput.value = expense.income || "";
    categoryInput.value = expense.category;
    dateInput.value = expense.date;

    editIndex = index;

    form.querySelector("button").textContent = "Update";
}



function deleteExpense(index) {

    expenses.splice(index, 1);

    saveExpenses();

    renderExpenses();
    updateTotal();
    updateChart();
}



function updateTotal() {

    let totalExpense = 0;
    let totalIncome = 0;

    for (let i = 0; i < expenses.length; i++) {
        totalExpense += expenses[i].amount;
        totalIncome += expenses[i].income || 0;
    }

    const balance = totalIncome - totalExpense;
    const remaining = budget - totalExpense;

    totalAmount.textContent = totalExpense.toLocaleString("en-IN");

    document.getElementById("monthly-total").textContent =
        totalExpense.toLocaleString("en-IN");

    document.getElementById("total-income").textContent =
        totalIncome.toLocaleString("en-IN");

    const balanceDisplay = document.getElementById("balance");

balanceDisplay.textContent =
    balance.toLocaleString("en-IN");

if (balance > 0) {
    balanceDisplay.style.color = "green";
} else if (balance < 0) {
    balanceDisplay.style.color = "red";
} else {
    balanceDisplay.style.color = "black";
}

    if (remainingBudgetDisplay) {
        remainingBudgetDisplay.textContent =
            remaining.toLocaleString("en-IN");

        remainingBudgetDisplay.style.color =
            remaining < 0 ? "red" : "green";
    }

    const budgetWarning = document.getElementById("budget-warning");
    if (budgetWarning) {
        budgetWarning.textContent =
            remaining < 0 ? "⚠ Budget Exceeded!" : "";
    }
    updateIncomeExpenseChart();
}



function updateChart() {

    const categoryTotals = {};

    for (let i = 0; i < expenses.length; i++) {
        const category = expenses[i].category;
        const amount = expenses[i].amount;

        categoryTotals[category] =
            (categoryTotals[category] || 0) + amount;
    }

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    const ctx = document.getElementById("expenseChart");
    if (!ctx) return;

    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{ data }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } }
        }
    });
}


setBudgetBtn.addEventListener("click", function () {

    const enteredBudget = Number(budgetInput.value);

    if (enteredBudget <= 0) {
        alert("Please enter valid budget amount");
        return;
    }

    budget = enteredBudget;
    saveBudget();

    budgetAmountDisplay.textContent =
        budget.toLocaleString("en-IN");

    updateTotal();
    budgetInput.value = "";
});


// Export CSV

if (exportCsvBtn) {

    exportCsvBtn.addEventListener("click", function () {

        if (expenses.length === 0) {
            alert("No expenses to export");
            return;
        }

        let csvContent = "Title,Category,Amount,Income,Date\n";

        for (let i = 0; i < expenses.length; i++) {

            const row = [
                expenses[i].title,
                expenses[i].category,
                expenses[i].amount,
                expenses[i].income || 0,
                expenses[i].date
            ];

            csvContent += row.join(",") + "\n";
        }

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "expenses.csv";
        a.click();

        URL.revokeObjectURL(url);
    });
}

// Load On Start

window.onload = function () {

    budgetAmountDisplay.textContent =
        budget.toLocaleString("en-IN");

    renderExpenses();
    updateTotal();
    updateChart();
};

// SEARCH FEATURE 

const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", function () {

    const searchText = this.value.toLowerCase();

    expenseList.innerHTML = "";
    document.getElementById("no-expense-message").style.display = "none";

    for (let i = 0; i < expenses.length; i++) {

        const title = expenses[i].title.toLowerCase();

        if (title.includes(searchText)) {
            displayExpense(expenses[i], i);
        }
    }
});

function updateIncomeExpenseChart() {

    let totalExpense = 0;
    let totalIncome = 0;

    for (let i = 0; i < expenses.length; i++) {
        totalExpense += expenses[i].amount;
        totalIncome += expenses[i].income || 0;
    }

    const ctx = document.getElementById("incomeExpenseChart").getContext("2d");

    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }

    incomeExpenseChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Income", "Expense"],
            datasets: [{
                label: "Amount",
                data: [totalIncome, totalExpense]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
// Dark Mode Toggle with Save

const darkModeBtn = document.getElementById("darkModeToggle");

// Load saved mode
if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
}

darkModeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
    } else {
        localStorage.setItem("darkMode", "disabled");
    }
});