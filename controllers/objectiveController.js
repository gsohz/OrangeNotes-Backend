const Objective = require("../models/ObjectiveSchema");
const Goal = require("../models/GoalSchema");
const { percentage } = require("../utils/aggregation");

//trocar o req.body._id por req.user._id

const addObjective = async (req, res) => {
  const { user } = req.headers;
  const { title, description, prediction } = req.body;
  const goalFather = req.params.id;

  try {
    if (!title) {
      res.status(400).json("Insira ao menos um título para o objetivo");
    } else {
      const objective = await Objective.create({
        title: title,
        description: description,
        prediction: prediction,
        user: user,
        goalFather: goalFather,
      }).catch((err) => {
        res.status(500);
      });

      const createdObjective = await objective.save();

      const objToUpdt = await Goal.findById(goalFather);
      const pct = await percentage(objToUpdt._id);

      await objToUpdt.updateOne({
        percentage: pct,
      });

      res.status(201).json(createdObjective);
    }
  } catch (err) {
    res.status(401).send("Ocorreu um erro");
  }
};

const updateObjective = async (req, res) => {
  const { user } = req.headers;
  const { title, description, prediction, completed } = req.body;
  const objective = await Objective.findById(req.params.id);

  if (!objective) {
    res.status(401).send("Objetivo não encontrado");
  } else {
    try {
      if (objective.user.toString() !== user.toString()) {
        res.status(401).json("Não foi possível realizar esta ação");
      } else {
        if (objective) {
          await objective.updateOne({
            title: title,
            description: description,
            prediction: prediction,
            completed: completed,
          });
          await objective.save();

          const objToUpdt = await Goal.findById(objective.goalFather);
          const pct = await percentage(objToUpdt._id);

          await objToUpdt.updateOne({
            percentage: pct,
          });

          res.status(200).json("Objetivo atualizado");
        } else {
          res.status(401).json("Ocorreu um erro ao atualizar o objetivo");
        }
      }
    } catch (err) {
      res.status(500).json("Ocorreu um erro");
    }
  }
};

const deleteObjective = async (req, res) => {
  const { user } = req.headers;
  const objective = await Objective.findById(req.params.id);

  if (!objective) {
    res.status(401).json("Objetivo não encontrado");
  } else {
    try {
      if (objective.user.toString() != user.toString()) {
        res.status(401).json("Não foi possível realizar esta ação");
      } else {
        if (objective) {
          await Objective.deleteOne({ _id: req.params.id });

          try {
            const goalToUpdt = await Goal.findById(objective.goalFather);
            const pct = await percentage(goalToUpdt._id);

            await goalToUpdt.updateOne({
              percentage: pct,
            });
          } catch (err) {
            res.status(500);
          }

          res.status(200).json("Objetivo deletado");
        }
      }
    } catch (err) {
      res.status(500).json(`Ocorreu um erro ${err}`);
    }
  }
};

module.exports = { addObjective, updateObjective, deleteObjective };
