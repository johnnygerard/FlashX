export { handleValidationFailure, usernameIsValid, passwordIsValid };
import { UNPROCESSABLE_CONTENT } from './httpStatusCodes.js';

const handleValidationFailure = (req, res) => {
    console.error('Server side validation failure');
    console.error(req.method, req.originalUrl);
    console.error(req.body);
    res.status(UNPROCESSABLE_CONTENT).end();
};

const usernameRegExp = /^[!-~]{1,128}$/;
const passwordRegExp = RegExp([
    /^(?=[^]*?\d)/,
    /(?=[^]*?[a-z])/,
    /(?=[^]*?[A-Z])/,
    /(?=[^]*?[!-/:-@[-`{-~])/,
    /[!-~]{11,128}$/,
].reduce((previous, current) => previous + current.source, ''));

const usernameIsValid = username =>
    typeof username === 'string' && usernameRegExp.test(username);

const passwordIsValid = password =>
    typeof password === 'string' && passwordRegExp.test(password);
