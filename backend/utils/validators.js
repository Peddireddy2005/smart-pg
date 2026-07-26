const { body, query, param } = require("express-validator");

const signupValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 80 }),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["owner", "resident"]).withMessage("Invalid role"),
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const googleAuthValidator = [
  body("credential").notEmpty().withMessage("Missing Google credential"),
  body("role").optional().isIn(["owner", "resident"]).withMessage("Invalid role"),
];

const forgotPasswordValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
];

const resetPasswordValidator = [
  param("token").notEmpty(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

const pgValidator = [
  body("name").trim().notEmpty().withMessage("PG name is required").isLength({ max: 120 }),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("contactPhone").optional().trim().isLength({ max: 20 }),
];

const roomValidator = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("rent").isFloat({ min: 0 }).withMessage("Rent must be a positive number"),
  body("depositAmount").optional().isFloat({ min: 0 }).withMessage("Deposit must be a positive number"),
];

const allocateValidator = [
  body("residentEmail").trim().isEmail().withMessage("A valid resident email is required"),
];

const complaintValidator = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 150 }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ max: 2000 }),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("category").optional().isIn(["Electrical", "Plumbing", "Internet", "Cleaning", "Food", "Others"]),
];

const reviewValidator = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }),
];

const generateRentValidator = [
  body("month").isInt({ min: 1, max: 12 }).withMessage("Month must be 1-12"),
  body("year").isInt({ min: 2000, max: 2100 }).withMessage("Year is invalid"),
];

const paginationValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const verifyEmailValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("code").trim().isLength({ min: 4, max: 6 }).withMessage("Invalid verification code"),
];

const announcementValidator = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 150 }),
  body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 2000 }),
  body("type").optional().isIn(["Water Shutdown", "Rent Reminder", "Holiday", "Cleaning", "General"]),
];

const staffValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("role").optional().isIn(["Cleaner", "Cook", "Security", "Electrician", "Plumber", "Other"]),
  body("salary").optional().isFloat({ min: 0 }),
];

const visitorValidator = [
  body("name").trim().notEmpty().withMessage("Visitor name is required"),
  body("phone").optional().trim(),
];

const expenseValidator = [
  body("category").isIn(["Electricity", "Water", "Maintenance", "Internet", "Salary", "Repairs", "Other"]),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
];

const inventoryValidator = [
  body("name").trim().notEmpty().withMessage("Item name is required"),
  body("category").optional().isIn(["Beds", "Mattress", "Fan", "AC", "Table", "Chair", "Cupboard", "Other"]),
  body("quantity").optional().isInt({ min: 0 }),
];

module.exports = {
  signupValidator,
  loginValidator,
  googleAuthValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  pgValidator,
  roomValidator,
  allocateValidator,
  complaintValidator,
  reviewValidator,
  generateRentValidator,
  paginationValidator,
  verifyEmailValidator,
  announcementValidator,
  staffValidator,
  visitorValidator,
  expenseValidator,
  inventoryValidator,
};