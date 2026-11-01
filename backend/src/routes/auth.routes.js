import { Router } from 'express';
import { ah } from '../utils/async.js';
import * as c from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter, emailLimiter } from '../middleware/rate-limit.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  forgotPasswordSchema, loginSchema, registerSchema, resendVerificationSchema,
  resetPasswordSchema, uuidParam, verifyEmailSchema,
} from '../schemas/index.js';

const r = Router();

r.post('/register', emailLimiter, validateBody(registerSchema), ah(c.register));
r.post('/login', authLimiter, validateBody(loginSchema), ah(c.login));
r.post('/verify-email', authLimiter, validateBody(verifyEmailSchema), ah(c.verifyEmail));
r.post('/resend-verification', emailLimiter, validateBody(resendVerificationSchema), ah(c.resendVerification));
r.post('/forgot-password', emailLimiter, validateBody(forgotPasswordSchema), ah(c.forgotPassword));
r.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), ah(c.resetPassword));
r.post('/refresh', ah(c.refresh));
r.get('/me', authenticate, ah(c.me));
r.post('/logout', authenticate, ah(c.logout));
r.post('/logout-all', authenticate, ah(c.logoutAll));
r.get('/sessions', authenticate, ah(c.listSessions));
r.delete('/sessions/:id', authenticate, validateParams(uuidParam), ah(c.revokeSession));

export default r;
