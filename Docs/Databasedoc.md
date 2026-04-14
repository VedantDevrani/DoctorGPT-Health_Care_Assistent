# 🗄️ Database Design

---

## 🧱 Database: MongoDB (Recommended)

---

## 📦 Collections

### 1. Users
{
  _id,
  name,
  email,
  created_at
}

---

### 2. Queries
{
  _id,
  user_id,
  age,
  gender,
  symptoms,
  duration,
  response,
  created_at
}

---

### 3. Doctors (Static for MVP)
{
  _id,
  name,
  specialization,
  city,
  rating
}

---

### 4. Conditions Cache (Optional Optimization)
{
  _id,
  symptoms_hash,
  ai_response,
  created_at
}

---

## 🔑 Relationships
- Users → Queries (1:N)

---

## ⚡ Optimization
- Cache repeated queries
- Index on symptoms

---