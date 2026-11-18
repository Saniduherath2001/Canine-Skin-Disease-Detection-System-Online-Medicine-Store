# DoggoCare — Manual Testing Checklist ✅

> **Project:** DoggoCare | **Date:** ___________  | **Tester:** ___________
> **Servers:** Backend `localhost:5001` | Frontend `localhost:5173` | ML `localhost:5000`

---

## 🔐 1. Authentication (Sign Up / Sign In / Forgot Password)

### 1.1 Sign Up (`/register`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1 | Valid details enter කරලා Sign Up | Account create වෙලා login redirect | |
| 2 | Email verification OTP screen show වෙනවාද | OTP input screen show | |
| 3 | Correct OTP enter කළාම | Account activate, login | |
| 4 | Wrong OTP enter කළාම | Error message show | |
| 5 | Already exist email enter කළාම | "Email already in use" error | |
| 6 | Invalid email format (abc) | Validation error show | |
| 7 | Password 6 characters below | Error show | |
| 8 | Fields empty submit කළාම | Required field errors show | |

### 1.2 Sign In (`/login`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 9 | Valid email + password | Login success, home redirect | |
| 10 | Wrong password | "Invalid credentials" error | |
| 11 | Not registered email | Error message show | |
| 12 | Empty fields submit | Validation errors show | |
| 13 | Login කළාම Navbar user name show | Username display in navbar | |

### 1.3 Forgot Password (`/forgot-password`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 14 | Valid email submit | OTP email send | |
| 15 | OTP enter + new password set | Password reset success | |
| 16 | Invalid email submit | Error show | |

---

## 🏠 2. Home Page (`/`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 17 | Page load කරාම | Hero section, features show | |
| 18 | "Shop Now" button click | Store page navigate | |
| 19 | "Detect" button click | Detect page navigate | |
| 20 | Navbar links work | All links navigate correctly | |
| 21 | Footer links work | Social links, pages work | |

---

## 🛍️ 3. Store (`/store`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 22 | Store load කරාම | Products list show | |
| 23 | Product card click | Product details page navigate | |
| 24 | "Add to Cart" button click (logged in) | Cart ලෙස add, toast notification | |
| 25 | "Add to Cart" (not logged in) | Login page redirect / error | |
| 26 | Category filter (if any) | Products filter correctly | |
| 27 | Product image show | Images load correctly | |
| 28 | Product price correct format (Rs. XXX) | Price show correctly, no decimals | |

---

## 📦 4. Product Details (`/product/:id`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 29 | Product details page load | Name, price, description, image show | |
| 30 | Quantity + button click | Quantity increment | |
| 31 | Quantity - button click (min 1) | Cannot go below 1 | |
| 32 | "Add to Cart" click | Cart ලෙස correct qty add | |
| 33 | Price correct (Rs. format) | No decimal issues | |
| 34 | Back button / breadcrumb | Store page return | |

---

## 🛒 5. Cart (`/cart`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 35 | Cart page load with items | Items list show correctly | |
| 36 | Item price correct (Rs. 236 not Rs. 0.236) | Correct price display | |
| 37 | Subtotal correct | price × qty sum correct | |
| 38 | Delivery fee Rs. 350 show | Delivery fee display | |
| 39 | Total = Subtotal + Rs. 350 | Correct total | |
| 40 | Quantity + click | Qty increment, total update | |
| 41 | Quantity - click (min 1) | Cannot go below 1 | |
| 42 | 🗑️ Delete button click | Item remove, total update | |
| 43 | Empty cart message | "Your shopping cart is empty" show | |
| 44 | "Proceed to Checkout" (logged in) | Checkout page navigate | |
| 45 | "Proceed to Checkout" (not logged in) | Login redirect | |
| 46 | "Continue Shopping" link | Store page navigate | |
| 47 | Page refresh කළාම | Cart items still there (DB sync) | |

---

## 💳 6. Checkout (`/checkout`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 48 | Checkout page load | Form + order summary show | |
| 49 | Order summary prices correct | Same as cart total | |
| 50 | All fields fill + submit (COD) | Order create success | |
| 51 | Invalid email field | Validation error | |
| 52 | Postal code not 5 digits | Validation error | |
| 53 | Phone invalid format | Validation error | |
| 54 | Empty required fields | Error messages show | |
| 55 | Order success page/message | Confirmation show | |
| 56 | Cart clear after order | Cart empty after success | |

---

## 🔬 7. Detect — Dog Skin Detection (`/detect`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 57 | Detect page load | Step 1 upload screen show | |
| 58 | File picker click | File browser open | |
| 59 | Drag & drop image | Image preview show | |
| 60 | Invalid file (PDF, TXT) upload | "Invalid format" error | |
| 61 | Valid JPG/PNG upload | Preview show, Submit enable | |
| 62 | Submit click (with image) | **Step 1.5 Confirmation screen show** ✨ | |
| 63 | Confirmation screen — image preview show | Uploaded image visible | |
| 64 | "✕ No, Go Back" click | Image clear, Step 1 return | |
| 65 | "✓ Yes, Continue" click | Step 2 Pet Info show | |
| 66 | Pet name empty + Continue | "Please enter dog's name" error | |
| 67 | Valid pet name, age, gender fill + Continue | API call, Step 3 or result | |
| 68 | Step 3 questions answer + Submit | Disease result show (Step 4) | |
| 69 | Step 4 disease result show | Disease name, confidence % show | |
| 70 | Step 4 "Healthy" result | Green healthy message show | |
| 71 | Step 4 "No match" result | Red "upload another" message show | |
| 72 | "Upload Another Image" button | Step 1 reset, all clear | |
| 73 | Step 2 "Back" button | Step 1 return | |

---

## ⭐ 8. Review (`/review`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 74 | Review page load | Review form show | |
| 75 | Star rating click | Rating select | |
| 76 | Valid review submit | Success message | |
| 77 | Rating not selected submit | Validation error | |
| 78 | Customer name empty submit | Error show | |
| 79 | Comment max 1000 chars | Cannot exceed limit | |

---

## 👤 9. Profile (`/profile`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 80 | Profile page load (logged in) | User info show | |
| 81 | Profile page (not logged in) | Login redirect | |
| 82 | Edit profile info + save | Updated info save | |
| 83 | Invalid phone number | Validation error | |
| 84 | Invalid postal code | Error show | |

---

## 📞 10. Contact (`/contact`)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 85 | Contact page load | Contact form + info show | |
| 86 | Valid message submit | Success message / email send | |
| 87 | Empty fields submit | Validation errors | |

---

## 🛡️ 11. Admin Panel (`/admin`)

### 11.1 Admin Login
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 88 | Valid admin credentials | Dashboard redirect | |
| 89 | Wrong password | Error message | |
| 90 | Empty fields | Validation error | |

### 11.2 Admin Dashboard
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 91 | Dashboard load | Stats, navigation show | |
| 92 | Items list show | All products list | |
| 93 | Add new item | Item create, list update | |
| 94 | Edit existing item | Item update correctly | |
| 95 | Delete item | Item remove from list | |
| 96 | Orders list show | All orders with status | |
| 97 | Order status change | Status update (Pending→Shipped) | |
| 98 | Users list show | All registered users | |
| 99 | Messages section | User messages show | |
| 100 | Reply to message | Reply send to user | |
| 101 | Logout | Admin session clear, login redirect | |

---

## 🔒 12. Security Tests
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 102 | `/cart` without login | Guest cart OR redirect | |
| 103 | `/profile` without login | Login redirect | |
| 104 | `/admin/dashboard` direct URL (no login) | Admin login redirect | |
| 105 | Invalid product ID URL (`/product/abc123`) | Error / 404 handle | |
| 106 | XSS — script tag in name field | Tag not execute | |

---

## 📱 13. Responsive Design
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 107 | Mobile view (375px) — Home | Layout correct, no overflow | |
| 108 | Mobile view — Store | Cards stack correctly | |
| 109 | Mobile view — Cart | Buttons accessible | |
| 110 | Mobile view — Detect | Upload area usable | |
| 111 | Tablet view (768px) | Layout adjust correctly | |

---

## 📊 Test Summary

| Section | Total Tests | Passed | Failed |
|---------|------------|--------|--------|
| Authentication | 16 | | |
| Home | 5 | | |
| Store | 7 | | |
| Product Details | 6 | | |
| Cart | 13 | | |
| Checkout | 9 | | |
| Detect (AI) | 17 | | |
| Review | 6 | | |
| Profile | 5 | | |
| Contact | 3 | | |
| Admin Panel | 14 | | |
| Security | 5 | | |
| Responsive | 5 | | |
| **TOTAL** | **111** | | |

---

> [!NOTE]
> Tests run කරන්න servers 3ම start කරන්නෙ ඕනෙ:
> - `node backend/server.js`  
> - `npm --prefix frontend run dev`  
> - Python ML server (`python app.py`)
