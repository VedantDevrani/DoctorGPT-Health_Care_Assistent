# 🧠 Backend Design

---

## 🧱 Tech Stack
- Node.js (Express)
- OpenAI API

---

## 🔌 API Endpoints

### POST /analyze
Request:
{
  age,
  gender,
  symptoms,
  duration
}

Response:
{
  condition,
  severity,
  home_remedies,
  doctor_recommendation,
  top_doctors_india,
  warnings,
  disclaimer
}

---

## 🔄 Flow

1. Receive input
2. Validate data
3. Send prompt to OpenAI
4. Parse JSON response
5. Return to frontend

---

## 🛡️ Safety Layer
- Block dangerous queries
- Add fallback messages

---