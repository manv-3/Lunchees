# Lunchees - ABESEC Ghaziabad Mess Lunch Coupon & QR System

A full-stack React + Spring Boot lunch coupon generator, QR code counter scanner, and mess subscription renewal portal built for **ABESEC Ghaziabad**.

## Deployed Render URL
- **Live Render URL:** `PENDING_DEPLOYMENT` *(Replace with your live Render URL after deployment, e.g. `https://lunchees-abesec.onrender.com`)*
- **Health Check Endpoint:** `/api/health`

---

## Login Credentials (All User Roles)

Use the following pre-seeded accounts to test every role in the application:

| Role | Username | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Bulk generate QR coupons, scan/redeem, manage users & subscriptions, view payment logs |
| **Mess Staff** | `staff` | `staff123` | Mess counter operator: scan student QR codes (camera/image/manual) & view daily meal stats |
| **Student (Active Plan)** | `student` | `student123` | Active Monthly Plan (`22CSE042` - Aarav Sharma): generate daily QR coupon & view history |
| **Student (Expired Plan)** | `student2` | `student123` | Expired Plan (`22CSE043` - Priya Verma): test Subscription Payment Renewal flow |

### Quick Reference Credentials
- **Admin Username:** `admin`
- **Admin Password:** `admin123`
- **Mess Staff Username:** `staff`
- **Mess Staff Password:** `staff123`
- **Student Username:** `student`
- **Student Password:** `student123`
- **Student (Expired) Username:** `student2`
- **Student (Expired) Password:** `student123`

---

## Key Features
1. **Role-Based Access Control (Admin, Mess Staff, Student):**
   - **Admin Dashboard:** Auto-generate QR coupons for all active subscribers or custom rosters, print QR coupon cards, track daily issuance/redemption, add students/staff, extend subscriptions, and inspect fee payment logs.
   - **Mess Staff Counter Portal:** Live webcam QR scanner (`jsQR`), QR PNG image upload scanner (works without webcam), manual/barcode input, and real-time counter tracker.
   - **Student Portal:** View subscription status, generate/download/print today's lunch QR code coupon, inspect past coupon history, and renew mess subscription plans (Weekly / Monthly / Semester) via the simulated payment section with instant receipts.
2. **Beginner-Friendly React UI:** Built with React 18, Vite, `qrcode`, and `jsqr` with a clean, straightforward college-project interface featuring the **ABESEC Ghaziabad** header and team footer.
3. **Single-Container Render Deployment:** Multi-stage `Dockerfile` builds the React frontend and packages it inside Spring Boot (`src/main/resources/static`) with H2 database and automatic startup seeding.

---

## Tech Stack
- **Frontend:** React 18, Vite, `qrcode`, `jsqr`, CSS
- **Backend:** Java 17, Spring Boot 3.3.5, Spring Security, Spring Data JPA, H2 Database
- **Deployment:** Docker + Render (`render.yaml`)

---

## Run Locally

### 1. Start Backend (Java 17+, Maven)
```bash
cd backend
mvn spring-boot:run
```
Backend runs at `http://localhost:8080`.

### 2. Start Frontend (Node 18+)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` (proxies `/api` requests to `http://localhost:8080`).

---

## Deploy on Render
1. Push this repository to GitHub.
2. Open [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service** (or **Blueprint** using `render.yaml`).
3. Connect your GitHub repository and select **Docker** as the runtime (Render detects `Dockerfile` automatically).
4. Set **Health Check Path** to `/api/health` and deploy on the **Free** plan.
5. Copy the live `https://*.onrender.com` URL and update the **Deployed Render URL** section at the top of this `README.md`, then commit & push to GitHub.

---

## Project Team
- **College:** ABESEC Ghaziabad
- **Developed & Maintained By:** Manvendra Singh, Manish Jha | CSE - CSE 22
- **Team:** Full Stack Development Team
- **© 2026 ABESEC Ghaziabad. All Rights Reserved.**
