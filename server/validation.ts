export { handleValidationFailure, usernameIsValid, passwordIsValid };
import { Request, Response } from 'express-serve-static-core';
import { UNPROCESSABLE_CONTENT } from './httpStatusCodes.js';

const handleValidationFailure = (req: Request, res: Response) => {
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

const usernameIsValid = (username: any) =>
    typeof username === 'string' && usernameRegExp.test(username);

const passwordIsValid = (password: any) =>
    typeof password === 'string' && passwordRegExp.test(password);
