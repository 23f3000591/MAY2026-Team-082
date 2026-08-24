# Neighborhood Skill Exchange Platform (NSEP)

> **Team ID:** MAY2026-Team-082  
> **Course:** Software Engineering Practice — IIT Madras BS Degree Program  

---

##  Prerequisites

- **Python:** `3.10+` with `pip` and `venv`
- **Node.js:** `18.18+` or `20.x+` with `npm`

---

##  Quick Start (Windows)

To start both backend and frontend servers with a single click, run **`run.bat`** in the project root:

```cmd
run.bat
```

- **Backend API:** `http://localhost:5001/api`
- **Frontend App:** `http://localhost:3000`

---

##  Manual Run Instructions

If running manually or on macOS/Linux:

### 1. Backend (Flask)

1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   - **Windows:**
     ```cmd
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize and seed the database:
   ```bash
   python seed.py
   ```
5. Start the backend server on port 5001:
   ```bash
   python -m flask run --port 5001
   ```

---

### 2. Frontend (Next.js)

1. Open a second terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server on port 3000:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

##  Test Logins

All demo accounts use the password: **`Password123!`**

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `akhil@gmail.com` | `Password123!` | Platform Administrator |
| **Mentor** | `saanvi@gmail.com` | `Password123!` | Python & Web Development |
| **Mentor** | `karthick@gmail.com` | `Password123!` | Yoga & Fitness |
| **Mentor** | `harshkumar@gmail.com` | `Password123!` | Guitar (Expert) |
| **Learner** | `harshad@gmail.com` | `Password123!` | Learner (Python) |
| **Learner** | `athul@gmail.com` | `Password123!` | Learner (Guitar) |
| **Learner** | `sooraj@gmail.com` | `Password123!` | Learner (Yoga) |
| **Learner** | `manas@gmail.com` | `Password123!` | Learner (Web Dev) |