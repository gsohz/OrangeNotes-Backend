const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GoalSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    goalFather: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
    },

    prediction: {
      type: Date,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", GoalSchema);

module.exports = Goal;
