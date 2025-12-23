const httpStatus = require('http-status');
const authService = require('./auth.service');
const tokenService = require('./token.service');

const register = async (req, res, next) => {
    try {
        const user = await authService.createUser(req.body);
        const token = tokenService.generateToken(user._id, user.role);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(httpStatus.CREATED).send({ user: userResponse, token });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await authService.loginUserWithEmailAndPassword(email, password);
        const token = tokenService.generateToken(user._id, user.role);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.send({ user: userResponse, token });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
};
