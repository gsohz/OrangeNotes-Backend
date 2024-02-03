const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ObjectiveSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
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

    completed: {
      type: Boolean,
      default: 0,
    },

    prediction: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Objective = mongoose.model("Objective", ObjectiveSchema);

module.exports = Objective;
