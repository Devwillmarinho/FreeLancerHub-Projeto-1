const { body, validationResult } = require("express-validator");

const validateRegistration = [
  body("email").isEmail().withMessage("Email inválido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres"),
  body("name").notEmpty().withMessage("Nome é obrigatório"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateProject = [
  body("title").notEmpty().withMessage("Título é obrigatório"),
  body("description").notEmpty().withMessage("Descrição é obrigatória"),
  body("budget").isNumeric().withMessage("Orçamento deve ser um número"),
  body("deadline").isISO8601().toDate().withMessage("Prazo inválido"),
  body("required_skills")
    .isArray()
    .withMessage("Habilidades devem ser um array"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateRegistration,
  validateProject,
};
