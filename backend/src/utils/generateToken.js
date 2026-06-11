import jwt from 'jsonwebtoken';

const generateToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  );

export default generateToken;
