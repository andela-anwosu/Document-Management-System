import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import db from '../models';
import Paginator from '../helpers/pagination';

const secret = process.env.SECRET_TOKEN || 'myverygoodbadtkey';

const userDetails = (user) => {
  const fields = {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    roleId: user.roleId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  return fields;
};
const userAttributes = [
  'id',
  'username',
  'firstname',
  'lastname',
  'email',
  'roleId',
  'createdAt',
  'updatedAt'
];

/**
 * User Controller class
 *
 * @param {object} req
 * @param {object} res
 * @returns{object} response object
 */
class UserController {

  /**
   * User Login
   * Route: POST: /users/login
   * @param {object} req
   * @param {object} res
   * @returns{object} response object
   */
  static login(req, res) {
    db.Users.findOne({
      where: {
        email: req.body.email
      }
    })
    .then((user) => {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        const token = jwt.sign({
          userId: user.id,
          roleId: user.roleId,
          username: user.username
        }, secret, { expiresIn: '2 days' });
        return res
          .status(200)
          .send({ message: 'Logged in', user: userDetails(user), token, expiresIn: '2 days' });
      }
      return res
        .status(400)
        .send({ message: 'Invalid username or password' });
    });
  }
  /**
   * User Logout
   * Route: POST: /users/logout
   * @param {object} req
   * @param {object} res
   * @returns {object} response object
   */
  static logout(req, res) {
    return res
      .status(201)
      .send({ message: 'Logged out' });
  }

  /**
   *  Create user class
   *
   * @param {object} req
   * @param {object} res
   * @returns{object} response object
   */
  static createUser(req, res) {
    if (req.body.roleId) {
      return res
        .status(403)
        .send({ message: 'you can not decide your roleId' });
    }
    if (!req.body.username || !req.body.firstname
    || !req.body.lastname || !req.body.password || !req.body.email) {
      return res
        .status(422)
        .send({ message: 'Please complete all fields' });
    }
    db.Users.findOne({
      where: {
        email: req.body.email
      }
    })
    .then((userExists) => {
      if (userExists) {
        return res.status(409)
        .send({ message: 'This email already exists' });
      }
    });
    const newUser = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      password: req.body.password,
      email: req.body.email
    };
    db.Users.create(newUser)
      .then((user) => {
        const token = jwt.sign({
          userId: user.id,
          roleId: user.roleId,
          username: user.username
        }, secret, { expiresIn: '2 days' });
        return res
          .status(201)
          .send({
            message: `${user.username} created`,
            user: userDetails(user),
            token,
            expiresIn: '2 days' });
      })
      .catch(err => res.status(400).send({ message: err.message }));
  }

  /**
   *  Create user method
   *
   * @param {object} req request being sent
   * @param {object} res object containing response
   * @returns{object} response object
   */
  static createAdminUser(req, res) {
    db.Users.findOne({
      where: {
        email: req.body.email
      } || {
        username: req.body.username
      }
    })
    .then((userExists) => {
      if (userExists) {
        return res
          .status(409)
          .send({ message: 'User already exists' });
      }
    });
    const newUser = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      password: req.body.password,
      email: req.body.email,
      roleId: 1
    };
    db.Users.create(newUser).then((user) => {
      const token = jwt.sign({
        userId: user.id,
        roleId: user.roleId
      }, secret, { expiresIn: '2 days' });

      return res.status(201)
      .send({
        message: `${user.username} created`,
        user: userDetails(user),
        token,
        expiresIn: '2 days' });
    })
    .catch((err) => {
      res
        .status(400)
        .send({ message: err.message });
    });
  }

  /**
   *  Find user method
   *
   * @param {object} req request being sent
   * @param {object} res object containing response
   * @returns{object} response object
   */
  static findUser(req, res) {
    let attributes;
    if (req.userType === 'admin') {
      attributes = userAttributes;
    } else {
      attributes = ['id', 'username'];
    }
    db.Users.findOne({
      where: {
        id: req.params.id
      },
      attributes
    })
    .then((user) => {
      if (user) {
        return res.status(200)
          .send({ user });
      }
      return res.status(404)
        .send({ message: 'Not found' });
    })
    .catch((err) => {
      res
        .status(500)
          .send({ message: err.message });
    });
  }

  /**
   *  Get users method with pagination
   *
   * @param {object} req request being sent
   * @param {object} res object containing response
   * @returns{object} response object
   */
  static getUsers(req, res) {
    const query = {};
    query.limit = (req.query.limit > 0)
      ? req.query.limit : 20;
    query.offset = (req.query.offset < 0)
      ? req.query.offset : 0;
    if (req.userType === 'admin') {
      query.attributes = userAttributes;
    } else {
      query.attributes = ['id', 'username'];
    }
    db.Users.findAndCountAll(query)
      .then((users) => {
        const metaData = {
          count: users.count,
          limit: query.limit,
          offset: query.offset
        };
        delete users.count;
        const pageData = Paginator.paginate(metaData);
        return res.status(200).send({ users, pageData });
      });
  }

  /**
   *  Update user method
   *
   * @param {object} req request being sent
   * @param {object} res object containing response
   * @returns{object} response object
   */
  static updateUser(req, res) {
    db.Users.findOne({
      where: {
        id: req.params.id
      }
    })
    .then((user) => {
      if (!user) {
        return res
          .status(404)
            .send({ message: 'Not found' });
      }
      const allowedFields = ['username', 'firstname', 'lastname', 'password'];

      allowedFields.forEach((field) => {
        user[field] = req.body[field]
          ? req.body[field]
          : user[field];
      });
      user.save().then(() => {
        res
          .status(200)
          .send({ message: 'User updated',
            User: userDetails(user) });
      });
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: err.message });
    });
  }

  /**
   * Delete a User
   * @param {object} req request being sent
   * @param {object} res object containing response
   * @returns{object} response object
   */
  static deleteUser(req, res) {
    db.Users.findOne({
      where: {
        id: req.params.id
      }
    })
    .then((user) => {
      if (!user) {
        return res.status(404)
          .send({ message: `User ${req.params.id} not found` });
      }
      db.Users.destroy({
        where: {
          id: req.params.id
        }
      })
      .then(() => {
        res.status(200).json({ message: 'User deleted successfully' });
      });
    });
  }

  /**
   * Get a User's documents
   *
   * @param {object} req request being sent
   * @param {object} res object containing response
   * @returns{object} response object
   */
  static getUserDocuments(req, res) {
    db.Documents.findAll({
      where: {
        userId: req.params.id
      }
    }).then((documents) => {
      if (documents.length < 1) {
        return res.status(404)
          .send({ message: 'No documents belonging to you found' });
      }
      return res.status(200).json({ message: 'Your documents', documents });
    }).catch((err) => {
      res.status(400).json({
        message: err.message
      });
    });
  }

  /**
   * Search for a user
   *
   * @param {object} req request being sent
   * @param {object} res object containing response
   * @returns{object} response object
   */
  static searchUser(req, res) {
    if (req.query.q) {
      db.Users.findAll({
        where: {
          username: {
            $iLike: `%${req.query.q}%`
          }
        }
      })
      .then(user => res.status(200).json({ message: 'Users found', user }));
    } else {
      return res
        .status(404)
        .send({ error: 'Provide a query' });
    }
  }
}

export default UserController;
