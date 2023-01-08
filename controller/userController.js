const userModel = require("../model/User");

class UserController {
  static async signup(req, res) {
    const user = new userModel(req.body);
    try {
      await user.save();
      const token = await user.generateAuthToken();
      res.status(201).send({ user, token });
    } catch (error) {
      res.status(400).send(error);
    }
  }
  static async login(req, res) {
    const user = await userModel.findByCredentials(
      req.body.email,
      req.body.password
    );
    try {
      const token = await user.generateAuthToken();
      res.send({ user, token });
    } catch {
      res.status(400).send(user);
    }
  }
  static async logout(req, res) {
    try {
      req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token;
      });
      await req.user.save();
      res.send("Logged out from this session successfully");
    } catch (error) {
      res.status(500).send(error);
    }
  }
  static async logoutAll(req, res) {
    try {
      req.user.tokens = [];
      await req.user.save();
      res.send("Logged out from all sessions successfully");
    } catch (error) {
      res.status(500).send(error);
    }
  }
  static async showAllUsers(req, res) {
    try {
      const users = await userModel.findAllUsers();
      res.send(users);
    } catch (error) {
      res.status(400).send(error);
    }
  }
}

module.exports = UserController;
