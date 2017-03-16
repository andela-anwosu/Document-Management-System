import express from 'express';
import Authentication from '../middlewares/authentication';
import UserController from '../controllers/users';

const router = express.Router();

router.route('/')
.get(Authentication.requireValidToken,
Authentication.validUser, UserController.getUser)
.post(UserController.createUser);

router.route('/:id')
.get(Authentication.requireValidToken,
Authentication.validUser, UserController.findUser)
.put(Authentication.requireValidToken,
Authentication.validUser, UserController.updateUser)
.delete(Authentication.requireValidToken,
Authentication.isAdmin, UserController.deleteUser);

router.route('/login')
.post(UserController.login);

router.route('/logout')
.post(Authentication.requireValidToken, UserController.logout);

router.route('/:id/documents')
.get(Authentication.requireValidToken,
Authentication.validUser, UserController.getUserDocuments);

export default router;
