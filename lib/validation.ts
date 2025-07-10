import { body, param, query } from "express-validator"

export const validateRegister = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("user_type").isIn(["company", "freelancer"]).withMessage("Invalid user type"),
  body("company_name").optional().trim().isLength({ min: 2 }),
  body("bio").optional().trim().isLength({ max: 500 }),
  body("skills").optional().isArray(),
]

export const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
]

export const validateProject = [
  body("title").trim().isLength({ min: 5 }).withMessage("Title must be at least 5 characters"),
  body("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
  body("budget").isFloat({ min: 0 }).withMessage("Budget must be a positive number"),
  body("deadline").optional().isISO8601().withMessage("Invalid deadline format"),
  body("required_skills").isArray({ min: 1 }).withMessage("At least one skill is required"),
]

export const validateProposal = [
  body("project_id").isUUID().withMessage("Invalid project ID"),
  body("message").trim().isLength({ min: 10 }).withMessage("Message must be at least 10 characters"),
  body("proposed_budget").isFloat({ min: 0 }).withMessage("Budget must be a positive number"),
  body("estimated_duration").optional().isInt({ min: 1 }).withMessage("Duration must be at least 1 day"),
]

export const validateMessage = [
  body("project_id").isUUID().withMessage("Invalid project ID"),
  body("content").trim().isLength({ min: 1 }).withMessage("Message content is required"),
]

export const validateReview = [
  body("contract_id").isUUID().withMessage("Invalid contract ID"),
  body("reviewed_id").isUUID().withMessage("Invalid reviewed user ID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 500 }),
]

export const validateId = [param("id").isUUID().withMessage("Invalid ID format")]

export const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
]
