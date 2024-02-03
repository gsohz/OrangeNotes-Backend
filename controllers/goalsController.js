const Goal = require("../models/GoalSchema");
const Objective = require("../models/ObjectiveSchema");
const {
  percentage,
  deleteAllWithFamily,
  countObjectivesCompleted,
} = require("../utils/aggregation");

String.prototype.toObjectId = function () {
  var ObjectId = require("mongoose").Types.ObjectId;
  return new ObjectId(this.toString());
};

const listGoal = async (req, res) => {
  const { user } = req.headers;

  if (user) {
    const goals = await Goal.find({
      goalFather: { $eq: null },
      user: user.toObjectId(),
    });

    goals.sort((a, b) => {
      return new Date(b.prediction) - Date(a.prediction);
    });
    res.json(goals);
  } else {
    res.status(401).json("Não foi possível identificar o usuário");
  }
};

const listGoalCompleted = async (req, res) => {
  const { user } = req.headers;

  try {
    if (user) {
      const goals = await Goal.find({
        completed: { $eq: true },
        user: user.toObjectId(),
        goalFather: { $eq: null },
      });
      goals.sort((a, b) => {
        return new Date(b.prediction) - Date(a.prediction);
      });

      const completeds = await countObjectivesCompleted(user);

      res.status(200).json({ goals, completeds });
    }
  } catch (err) {
    res.status(500);
  }
};

const addGoal = async (req, res) => {
  const { user } = req.headers;
  const { title, description, prediction } = req.body;

  const goalFather = await Goal.findById(req.params.id);

  try {
    if (!title) {
      res.status(400).send("Insira ao menos um título para a meta");
    } else {
      if (!goalFather && req.params.id) {
        res.status(500).send("Ocorreu um erro meta pai não encontrada");
      } else {
        const goal = await Goal.create({
          title: title,
          description: description,
          prediction: prediction,
          user: user,
          goalFather: goalFather?._id,
        }).catch((err) => {
          res.status(500);
        });

        if (goalFather) {
          const pct = await percentage(goal.goalFather);

          await goalFather.updateOne({
            percentage: pct,
          });
        }
        const createdGoal = await goal.save();

        res.status(201).send(createdGoal);
      }
    }
  } catch (err) {
    res.status(500).send("Ocorreu um erro");
  }
};

const openGoal = async (req, res) => {
  const goalId = req.params.id;
  const goal = await Goal.findById(goalId);
  const objectives = await Objective.find({ goalFather: goalId });
  const goals = await Goal.find({ goalFather: goalId });

  if (objectives?.length > 0) {
    objectives.sort((a, b) => {
      return new Date(b.prediction) - Date(a.prediction);
    });
  }

  if (goals?.length > 0) {
    goals.sort((a, b) => {
      return new Date(b.prediction) - Date(a.prediction);
    });
  }

  if (goal && objectives && goals) {
    res.json({ goal, objectives, goals });
  } else if (goal && objectives) {
    res.json({ goal, objectives });
  } else if (goal && goals) {
    res.json({ goal, goals });
  } else if (goal) {
    res.json(goal);
  } else {
    res.status(404).json("Meta não encontrada");
  }
};

const updateGoal = async (req, res) => {
  const { user } = req.headers;
  const { title, description, prediction, completed } = req.body;
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(401).json("Meta não encontrada");
  } else {
    try {
      if (goal.user.toString() !== user.toString()) {
        res.status(401).send("Não foi possível realizar esta ação");
      } else {
        if (goal) {
          await goal.updateOne({
            title: title,
            description: description,
            prediction: prediction,
            completed: completed,
          });

          await goal.save();
          const goalToUpdt = await Goal.findById(goal.goalFather);
          if (goalToUpdt) {
            const pct = await percentage(goalToUpdt._id);
            await goalToUpdt.updateOne({
              percentage: pct,
            });
          }

          res.status(200).json("Meta atualizada");
        } else {
          res.status(401).json("Ocorreu um erro ao atualizar a meta");
        }
      }
    } catch (err) {
      res.status(500).json("Ocorreu um erro");
    }
  }
};

const deleteGoal = async (req, res) => {
  const { user } = req.headers;
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(401).json("Meta não encontrada");
  } else {
    try {
      if (goal.user.toString() !== user.toString()) {
        res.status(401).send("Não foi possível realizar esta ação");
      } else {
        if (goal) {
          const id = goal.id;

          try {
            const hasFamilyGoal = await Goal.find({ goalFather: id });
            const hasFamilyObj = await Objective.find({ goalFather: id });

            if (hasFamilyGoal != "" || hasFamilyObj != "") {
              await deleteAllWithFamily(id).catch((err) => {
                res.status(500);
              });
            }
          } catch (err) {
            res.status(500);
          }

          await Goal.deleteOne({ _id: id });

          try {
            if (goal.goalFather) {
              const goalToUpdt = await Goal.findById(goal.goalFather);
              const pct = await percentage(goalToUpdt._id);

              await goalToUpdt.updateOne({
                percentage: pct,
              });
            }
          } catch (err) {
            res.status(500);
          }

          res.status(200).json("Meta deletada");
        }
      }
    } catch (err) {
      res.status(500).json(`Ocorreu um erro ${err}`);
    }
  }
};

module.exports = {
  listGoal,
  addGoal,
  openGoal,
  deleteGoal,
  updateGoal,
  listGoalCompleted,
};
