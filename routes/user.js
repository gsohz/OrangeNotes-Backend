const express = require("express");
const { requireLogin } = require("../middleware/authMiddleware");
const {
  listGoal,
  addGoal,
  openGoal,
  deleteGoal,
  updateGoal,
  listGoalCompleted,
} = require("../controllers/goalsController");
const {
  addObjective,
  deleteObjective,
  updateObjective,
} = require("../controllers/objectiveController");
const { userLogin, userRegister } = require("../controllers/userController");
const router = express();

router.route("/login").post(userLogin);
router.route("/registro").post(userRegister);

router.route("/").get(requireLogin, listGoal);

router.route("/goal").post(requireLogin, addGoal);
router
  .route("/:id/goal")
  .get(requireLogin, openGoal)
  .post(requireLogin, addGoal)
  .put(requireLogin, updateGoal)
  .delete(requireLogin, deleteGoal);

router.route("/completeds").get(requireLogin, listGoalCompleted);

router
  .route("/:id/objective")
  .post(requireLogin, addObjective)
  .put(requireLogin, updateObjective)
  .delete(requireLogin, deleteObjective);

module.exports = router;
