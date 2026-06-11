const sanitizeUser = (user) => {
  const plainUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  delete plainUser.password;
  delete plainUser.__v;

  return plainUser;
};

export default sanitizeUser;
