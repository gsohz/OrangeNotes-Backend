const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema");

//Login check
const requireLogin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      //Remove Bearer
      token = req.headers.authorization.split(" ")[1];

      //Decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401).send({ message: "Token não autorizado" });
    }
  }

  if (!token) {
    res.status(401).send({ message: "Falha, nenhum token encontrado" });
  }
};

module.exports = { requireLogin };
