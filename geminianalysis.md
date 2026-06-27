โปรเจกต์ระบบสำรวจและจำลองการจองที่นั่งสำหรับงาน NamtanFilm FanCon นี้น่าสนใจมากครับ ถือเป็นการผสมผสานระหว่างระบบ Survey และ Ticketing ที่ดีเลย

เพื่อให้ระบบออกมา เสถียร โค้ดคลีน ปลอดภัย และใช้ทรัพยากรน้อยที่สุด (Fast & Lightweight) ตามที่คุณต้องการ การใช้ Vite + React + TypeScript เป็นทางเลือกที่ตอบโจทย์มาก ส่วนการใช้ Google Sheets เป็น Database นั้น เพื่อความปลอดภัยเราจะไม่ให้ Frontend ต่อกับ Sheets ตรงๆ แต่จะใช้ Google Apps Script (GAS) เป็น API (Backend) คั่นกลางครับ

ผมได้วิเคราะห์และวางแผนสถาปัตยกรรมระบบ (System Architecture) และเครื่องมือที่เหมาะสมมาให้ ดังนี้ครับ

🛠️ Tech Stack & Architecture (เทคโนโลยีที่แนะนำ)
Frontend Framework: Vite + React + TypeScript (ทำงานเร็ว Build ไว โค้ดมี Type ป้องกัน Error)

Styling & UI: Tailwind CSS (ออกแบบ Dark Theme โทน ดำ-ฟ้า-เหลือง ได้ง่ายและคลีน) + Framer Motion (สำหรับทำ Animation ตอนโหลดหน้าหรือโชว์ตั๋ว)

Form Management & Validation: React Hook Form + Zod (จัดการฟอร์มได้เสถียรที่สุด และตรวจสอบข้อมูลได้เป๊ะมาก)

State Management: Zustand (จัดการ State การจองที่นั่งและข้อมูลฟอร์มแบบมินิมอล ไม่ซับซ้อนเท่า Redux)

Ticket Generation: html2canvas หรือ dom-to-image (แปลง HTML/CSS ของรูปตั๋วให้เป็นไฟล์ภาพ หรือแสดงผลให้เซฟได้ทันที)

Database & API: Google Sheets + Google Apps Script (GAS) สร้างเป็น Web App (REST API: GET/POST)

Charts (Admin): Recharts หรือ Chart.js (ทำกราฟแสดงผลสรุปสวยๆ)

📊 การออกแบบฐานข้อมูล (Google Sheets Structure)
แบ่ง Sheet ออกเป็น 3 แท็บ (Tabs) หลักๆ เพื่อไม่ให้ข้อมูลปนกัน:

Tab "Responses": เก็บข้อมูลดิบ (Timestamp, Email, ชื่อ, โซน, วันที่ไป, ราคา D1, ราคา D2, ข้อเสนอแนะ)

Tab "Seats_Day1": เก็บผัง 3,492 ที่นั่ง (Seat_ID, Status [Available/Booked], Email_Owner)

Tab "Seats_Day2": เก็บผัง 3,492 ที่นั่ง สำหรับวันที่สอง

🧩 วิเคราะห์และวางแผนการทำงานทีละส่วน (System Flow)
A. ระบบฟอร์ม (Form & Validation)
กัน Email ซ้ำ: เมื่อผู้ใช้กด Submit ระบบ Frontend จะยิง API (ผ่าน GAS) ไปเช็กใน Sheet Responses ก่อนว่ามีอีเมลนี้หรือยัง ถ้ามีแล้ว GAS จะรีเทิร์น Error กลับมาแจ้งเตือน

ตรวจสอบ Domain Email: * ระดับเบื้องต้น: ใช้ Regex + Zod ตรวจสอบรูปแบบอีเมล (เช่น ต้องมี @ และลงท้ายด้วย .com, .co.th ฯลฯ)

ระดับ Advance: หากต้องการเช็กว่าโดเมนมีอยู่จริง (MX Record) อาจจะต้องใช้ API ภายนอกฟรี (เช่น Abstract Email Validation API) เข้ามาช่วยเช็กจังหวะที่ผู้ใช้พิมพ์อีเมลเสร็จ หรือให้ GAS ใช้ UrlFetchApp ยิงไปเช็ก

UX/UI: แบ่งฟอร์มเป็น Step (Multi-step form) เพื่อไม่ให้หน้าจอดูยาวเกินไป

B. ระบบผังที่นั่งคอนเสิร์ต (Seating Plan Logic)
เนื่องจากมีที่นั่งถึง 3,492 ที่นั่งต่อวัน การวาด DOM 3 พันกว่าชิ้นบน React อาจจะทำให้เว็บอืดได้

คำแนะนำ: ให้ทำเป็น Grid บล็อกเล็กๆ หรือวาดลงบน <canvas> เพื่อ Performance ที่ดีที่สุด

Logic การจองอัตโนมัติ:

เมื่อฟอร์มส่งข้อมูลผ่าน ระบบหลังบ้าน (GAS) จะเช็กว่าเลือก "วันแรก", "วันที่สอง" หรือ "ทั้งสองวัน"

GAS จะวิ่งไปหาที่นั่งที่ Status = Available ลำดับแรกสุดใน Sheet Seats_DayX

ทำการเปลี่ยน Status เป็น Booked ผูกกับ Email ผู้จอง และส่งเลขที่นั่ง (Seat ID) กลับมาให้ Frontend

UI ผังที่นั่ง: ที่นั่งว่างจะเป็นสีกราไฟต์/เทาเข้ม ที่นั่งถูกจองแล้วจะเรืองแสงเป็น สีฟ้า (Blue) หรือ สีเหลือง (Yellow) ตามธีม

C. ระบบออกตั๋ว E-Ticket
เมื่อ Frontend ได้รับการยืนยัน (Success) และได้เลขที่นั่งกลับมาจาก API ระบบจะพาไปหน้า "Your Ticket"

นำข้อมูล (ชื่อ, วันที่, ราคา, เลขที่นั่ง) มาวางทับบน Template ภาพตั๋ว 4 แบบ (แบ่งตามสีหรือดีไซน์ตามราคา)

ใช้ html2canvas ถ่ายภาพ Component นั้น ให้ผู้ใช้กดปุ่ม "Save/Download Ticket" เพื่อแชร์ลง X (Twitter) หรือโซเชียลอื่นๆ (เป็นการช่วยโปรโมทงานไปในตัว)

D. การแสดงผลข้อมูล Public (Data Visualization)
หน้า Home หรือหน้า Dashboard สำหรับ User ทั่วไป

แสดง Progress Bar ขนาดใหญ่: "ขณะนี้ที่นั่งถูกจองไปแล้ว X% (YYYY / 3492)"

ดึงข้อมูล (แบบ Cached เพื่อไม่ให้ยิง API ถี่เกินไป) มาแสดงผลให้หน้าเว็บดูมีความเคลื่อนไหว

E. ระบบหลังบ้าน (Admin Dashboard)
สร้าง Route พิเศษ เช่น /admin (อาจจะมีรหัสผ่านง่ายๆ ล็อกไว้หน้าเว็บ)

ดึงข้อมูลจาก GAS มาแสดงผลผ่าน Recharts โดยสรุปดังนี้:

Scorecard: จำนวนคนตอบฟอร์มทั้งหมด / จำนวนคนเข้าร่วมจริง (ไม่นับ Not sure/No)

Pie Chart: สัดส่วนภูมิภาค (กทม. / ตจว. / ต่างประเทศ)

Bar Chart: ความต้องการบัตรแต่ละราคา (เปรียบเทียบ Day 1 vs Day 2)

Donut Chart: สัดส่วนคนเลือกเข้า Day 1, Day 2, หรือ Both Days

Data Grid: ตารางแสดงคำแนะนำ/ข้อเสนอแนะ (มีช่อง Search & Filter)

🎨 แนวทางการออกแบบ (UI/UX Design)
Theme: Dark Mode เป็นหลัก (พื้นหลังสี #121212 หรือสีน้ำเงินเข้มจัด #0A192F)

Primary Color: สีฟ้าน้ำเงิน (Royal Blue / Neon Blue) สำหรับปุ่มหลักและเน้นข้อความ

Accent Color: สีเหลือง (Gold / Neon Yellow) สำหรับแจ้งเตือน, ตั๋ว VIP หรือสถานะที่นั่ง

Typography: ฟอนต์ที่ดูทันสมัย อ่านง่าย (เช่น Noto Sans Thai, Kanit หรือ Prompt)

Micro-interactions: ปุ่มมี Hover effect แบบ Glow (เรืองแสง) เมื่อเอาเมาส์ชี้ เพื่อให้เข้ากับฟีลลิ่งคอนเสิร์ต

🚀 ขั้นตอนการเริ่มพัฒนา (Next Steps)
ตั้งโครงสร้าง Google Sheet: สร้างไฟล์และคอลัมน์ต่างๆ ให้พร้อม จากนั้นเขียน Google Apps Script doPost(e) และ doGet(e) แล้ว Deploy เป็น Web App

Initialize Project: ```bash
npm create vite@latest namtanfilm-survey -- --template react-ts
cd namtanfilm-survey
npm install tailwindcss postcss autoprefixer react-hook-form zod zustand
npx tailwindcss init -p

สร้าง UI Form: เขียนหน้าฟอร์มรับข้อมูล และต่อ API เข้ากับ GAS

สร้างผังที่นั่ง & ตั๋ว: นำข้อมูลที่ได้มา Render ตั๋ว



Act as an Expert Full-Stack Developer. Please create a complete, production-ready Web Application for the "NamtanFilm FanCon Survey and Seat Reservation System".

Here are the strict requirements for the project:

### 1. Tech Stack
*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS (Dark theme as default. Use #121212 or dark gray for background, with Neon Blue and Yellow as primary and accent colors).
*   **Backend / Database:** Google Apps Script (GAS) acting as a REST API (GET/POST) connecting to Google Sheets.
*   **Architecture:** Create a Single Page Application (SPA) inside a single `App.tsx` file for the frontend to keep it simple, and a separate `backend.gs` file for the Google Apps Script.

### 2. Core Features & Logic
*   **Capacity Limit:** Maximum 3,492 seats available per day (Day 1 and Day 2).
*   **Email Uniqueness & Validation:** 
    *   The system MUST prevent duplicate emails. One email = One registration.
    *   Basic email domain validation to prevent fake/random emails.
*   **Seat Allocation Logic:**
    *   If user selects "Day 1", assign 1 available seat from Day 1 plan.
    *   If user selects "Day 2", assign 1 available seat from Day 2 plan.
    *   If user selects "Both Days", assign 1 seat for Day 1 and 1 seat for Day 2.
    *   If user selects "Undecided", DO NOT assign any seats.

### 3. Frontend Views (UI Components)
Create a navigation flow between these views:

**A. Home / Dashboard View (Public)**
*   Show a Welcome message.
*   Display a live Progress Bar showing the percentage of booked seats out of 3,492 for both Day 1 and Day 2.

**B. Survey Form View**
Create a form with the following exact fields and conditional logic:
1.  **Email (Required):** Must be unique and validated.
2.  **Name/Fandom Alias (Required):** Text input.
3.  **Will you attend? (Required):** Dropdown (Definitely / Probably / Not sure yet / No).
4.  **Origin (Required):** Dropdown (Bangkok / Bangkok Metropolitan / Northern / Central / Eastern / Northeastern / Southern / Overseas).
5.  **Which day(s)? (Required - ONLY show if Q3 is Definitely or Probably):** Dropdown (Day 1 / Day 2 / Both Days / Undecided).
6.  **Ticket Price DAY 1 (Required - ONLY show if Q5 is Day 1 or Both):** Dropdown (6,000-7,000 / 4,500-5,500 / 3,000-4,000 / 1,500-2,500 / Waiting for benefits).
7.  **Ticket Price DAY 2 (Required - ONLY show if Q5 is Day 2 or Both):** Dropdown (6,000-7,000 / 4,500-5,500 / 3,000-4,000 / 1,500-2,500 / Waiting for benefits).
8.  **Comments (Optional):** Textarea.

**C. Virtual E-Ticket View**
*   After successful form submission, display a beautiful virtual E-Ticket.
*   The ticket design/color MUST change based on the ticket price tier they selected.
*   Show their Name, the Day(s) they are attending, and their assigned Seat ID (e.g., D1-0012).

**D. Admin Dashboard View**
*   A summary page showing statistics:
    *   Total responses.
    *   Total attending.
    *   Origin demographics (Region breakdown).
    *   Ticket price demand.
    *   Day 1 vs Day 2 attendance.

### 4. Backend (Google Apps Script - backend.gs)
Provide the full `.gs` code that will:
*   `doPost(e)`: Handle form submissions. Implement `LockService` to prevent race conditions when assigning seats. Check for email duplicates against the sheet. Find the next available seat ID based on current row count. Append the row.
*   `doGet(e)`: Return JSON statistics (total booked for D1/D2) for the public progress bar and Admin dashboard.

### 5. Output Requirements
Please generate the complete source code. The output should be modern, clean, highly stable, and handle loading states and error messages gracefully. Deliver the React code in one block (`App.tsx`) and the GAS code in another block (`backend.gs`).
```eof

นำ Prompt นี้ไปใช้ได้เลยครับ หาก AI สร้างโค้ดออกมาแล้วมีจุดไหนที่ต้องการให้ผมช่วยรีวิวหรือปรับแต่งเพิ่มเติม (เช่น การวาดผังที่นั่งแบบละเอียด) สามารถส่งโค้ดกลับมาได้ตลอดครับ