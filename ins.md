### **Loan Management SaaS Platform**  

## **🛠️ Technologies Used**  
- **Next.js 14** → Frontend framework  
- **javascript** → Type safety  
- **Tailwind CSS** → Styling  
- **Supabase** → Database & backend  
- **Clerk** → Authentication  
- **Stripe** → Payments (Subscription model)  
- **Vercel** → Deployment  

---

## **📌 Core Features**  

### **1️⃣ User Authentication**  
- **Clerk** for authentication (Google, Email, etc.)  
- Store user details in **Supabase**  

### **2️⃣ Loan Tracking System**  
- Add new loans with **amount, due date, borrower details**  
- Edit or delete loans anytime  
- Track **pending & completed** loans  

### **3️⃣ Subscription Plans (SaaS Model) 💳**  
💰 **Monetization using Subscription Tiers:**  

| Plan  | Price  | Features  |
|--------|--------|------------------|
| Free  | $0  | Add up to **5 loans**, basic tracking  |
| Pro  | $15/month  | **Unlimited loans**, analytics, CSV exports, priority support  |

- **Stripe Integration** → Users can **subscribe or cancel anytime**  
- **Database Field for Premium Users:**  
  ```ts
  isPremium: boolean // true for Pro users, false for Free users
  ```
- Only **Pro users** get access to **advanced analytics & exports**  

### **4️⃣ Loan Reminders & Notifications**  
- **Email reminders** for due dates  
- **SMS alerts** (Future upgrade for monetization)  

### **5️⃣ Loan Analytics (Pro Feature)**  
- **Graph & insights** on total loans, pending payments  
- CSV export for Pro users  

### **6️⃣ Payment Handling (Stripe) 🔗**  
- **Stripe Checkout** for subscription payments  
- **Auto-cancel Pro features** when subscription ends  

---

## **📂 Database Schema (Supabase)**
```ts
// Users Table
{
  id: uuid,
  email: string,
  name: string,
  isPremium: boolean, // Subscription status
  createdAt: timestamp
}

// Loans Table
{
  id: uuid,
  userId: uuid, // Foreign key to Users table
  borrowerName: string,
  amount: decimal,
  dueDate: timestamp,
  status: enum('pending', 'paid'),
  createdAt: timestamp
}

// Transactions Table (For Payments)
{
  id: uuid,
  userId: uuid,
  amount: decimal,
  type: enum('subscription', 'penalty'),
  stripeSessionId: string,
  status: enum('pending', 'completed'),
  createdAt: timestamp
}
```

---

## **📌 Pages in the App**
1️⃣ **Home Page** → Overview of platform features  
2️⃣ **Dashboard** → Loan management & tracking  
3️⃣ **Subscription Page** → Upgrade to **Pro** plan  
4️⃣ **Settings** → Manage profile & subscription  

---

## **📢 Next Steps**
- **Step 1:** Set up Supabase & Clerk for authentication  
- **Step 2:** Implement loan tracking system  
- **Step 3:** Add Stripe subscription logic  
- **Step 4:** Create Pro features (Analytics, CSV export)  

---


## **📊 Dashboard Features**

1️⃣ Overview Section (Loan Summary)
- Total Loans → Count of all loans
- Pending Loans → Count of unpaid loans
- Paid Loans → Count of completed loans
- Upcoming Due Date → Show the closest due date
UI Idea: Use cards or a grid layout to display these stats.

2️⃣ Loan List (Main Table)
Show a table with these columns:
Borrower Name
Loan Amount
Due Date
Status (Pending/Paid)
Actions (Edit / Delete)
UI Idea: Use a sortable, filterable table (like React Table or TanStack Table).

3️⃣ Loan Actions (CRUD)
Add New Loan (Form with borrower name, amount, due date)
Edit Loan (Update amount, due date, status)
Delete Loan
UI Idea: Use a modal or drawer for adding/editing loans.

4️⃣ Subscription Status (Pro Feature)
If Free User → Show a banner to Upgrade to Pro
If Pro User → Show subscription details (active, renewal date)
5️⃣ Loan Analytics (For Pro Users)
Graph of Pending vs. Paid Loans
CSV Export Button
UI Idea: Use Recharts for graphs & file-saver for CSV downloads.