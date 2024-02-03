const Objective = require("../models/ObjectiveSchema");
const Goal = require("../models/GoalSchema");

String.prototype.toObjectId = function () {
  var ObjectId = require("mongoose").Types.ObjectId;
  return new ObjectId(this.toString());
};

async function percentage(fatherId) {
  const completedTrue = [
    {
      $match: {
        goalFather: fatherId,
        completed: true,
      },
    },
    {
      $group: {
        _id: `$_id`,
        sum: {
          $sum: 1,
        },
      },
    },
  ];

  const completedFalse = [
    {
      $match: {
        goalFather: fatherId,
        completed: false,
      },
    },
    {
      $group: {
        _id: `$_id`,
        sum: {
          $sum: 1,
        },
      },
    },
  ];

  const aggObjCursor1 = await Objective.aggregate(completedTrue);
  const aggObjCursor2 = await Objective.aggregate(completedFalse);
  const aggGoalCursor1 = await Goal.aggregate(completedTrue);
  const aggGoalCursor2 = await Goal.aggregate(completedFalse);

  let complete = 0,
    incomplete = 0,
    total = 0;

  aggObjCursor1.forEach((obj) => {
    complete++;
  });

  aggObjCursor2.forEach((obj) => {
    incomplete++;
  });

  aggGoalCursor1.forEach((obj) => {
    complete++;
  });

  aggGoalCursor2.forEach((obj) => {
    incomplete++;
  });

  total = complete + incomplete;

  total = (complete * 100) / total;

  const goalToUpdt = await Goal.findById(fatherId);
  const goalFatherToUpdt = await Goal.findById(goalToUpdt.goalFather);

  if (Math.round(total) === 100) {
    await goalToUpdt.updateOne({
      completed: true,
    });

    if (goalToUpdt.goalFather) {
      const pct = await percentage(goalFatherToUpdt._id);
      await goalFatherToUpdt.updateOne({
        percentage: pct,
      });
    }
  } else {
    await goalToUpdt.updateOne({
      completed: false,
    });
    if (goalToUpdt.goalFather) {
      const pct = await percentage(goalFatherToUpdt._id);
      await goalFatherToUpdt.updateOne({
        percentage: pct,
        completed: false,
      });
    }
  }

  return total !== 0 ? Math.round(total) : 0;
}

async function deleteAllWithFamily(fatherId) {
  const goalFamily = await Goal.find({ goalFather: fatherId });
  const objectiveFamily = await Objective.findOne({ goalFather: fatherId });

  try {
    if (goalFamily) {
      await Goal.deleteMany({ goalFather: fatherId });
      goalFamily.forEach((goal) => {
        deleteAllWithFamily(goal._id);
      });
    } else {
      await Goal.deleteMany({ goalFather: fatherId });
    }

    if (objectiveFamily) {
      await Objective.deleteMany({ goalFather: fatherId });
      objectiveFamily.forEach((obj) => {
        deleteAllWithFamily(obj.goalFather);
      });
    } else {
      await Objective.deleteMany({ goalFather: fatherId });
    }
  } catch (err) {
    return err;
  }
}

async function countObjectivesCompleted(userId) {
  const completedObjTrue = [
    {
      $match: {
        completed: true,
        user: userId.toObjectId(),
      },
    },
    {
      $count: "completed",
    },
  ];

  const completedSubGoal = [
    {
      $match: {
        user: userId.toObjectId(),
        completed: true,
        goalFather: {
          $ne: null,
        },
      },
    },
    {
      $count: "completed",
    },
  ];

  const completeMainGoal = [
    {
      $match: {
        user: userId.toObjectId(),
        completed: true,
        goalFather: null,
      },
    },
    {
      $count: "completed",
    },
  ];

  const aggObjCursor1 = await Objective.aggregate(completedObjTrue);
  const aggGoalCursor1 = await Goal.aggregate(completedSubGoal);
  const aggMainGoalCursor1 = await Goal.aggregate(completeMainGoal);

  const resultObj = aggObjCursor1[0]?.completed;
  const resultGoal = aggGoalCursor1[0]?.completed;
  const resultMainGoal = aggMainGoalCursor1[0]?.completed;

  const result = { resultObj, resultGoal, resultMainGoal };

  return result !== "" ? result : 0;
}

module.exports = { percentage, deleteAllWithFamily, countObjectivesCompleted };
