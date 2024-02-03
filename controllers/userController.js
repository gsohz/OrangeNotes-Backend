const User = require("../models/UserSchema");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

const userLogin = async (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    var user = await User.findOne({ email: email }).catch((err) =>
      res.status(500).send({ message: "Erro ao pesquisar usuário" })
    );
  } else res.status(401).send({ message: "Preencha todos os campos" });

  if (user != null) {
    var result = await bcrypt.compare(password, user.password);

    if (result === true) {
      return res.status(201).json({
        id: user.id,
        name: user.name,
        email,
        token: generateToken(user._id),
      });
    }

    res.status(401).send({ message: "Credenciais incorretas" });
  }
};

const userRegister = async (req, res) => {
  const { username, email, password } = req.body;

  if (username && email && password) {
    const userExists = await User.findOne({ email: email }).catch((err) => {
      res.status(500).send({ message: "Ocorreu um erro ao pesquisar usuário" });
    });
    if (userExists) {
      res.status(401).send({ message: `Erro ao criar conta.` });
    } else {
      const user = await User.create({
        username,
        email,
        password,
      }).catch((err) => {
        res.status(401).send({ message: "Ocorreu um erro ao criar usuário" });
      });

      if (user) {
        await user.save();
        return res.status(201).json({
          name: user.name,
          email,
          token: generateToken(user._id),
        });
      }
    }
  } else
    res.send({ message: "Preencha todos os campos para criar uma conta." });
};

module.exports = { userLogin, userRegister };
