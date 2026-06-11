import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';

const DEFAULT_ADMIN = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  phone: '',
  role: 'admin',
};

export const ensureDefaultAdminExists = async () => {
  const existingAdmin = await Admin.findOne({ email: DEFAULT_ADMIN.email }).select('_id email');

  if (existingAdmin) {
    logger.info('Default admin already exists', { email: DEFAULT_ADMIN.email });
    return { created: false, email: DEFAULT_ADMIN.email };
  }

  await Admin.create(DEFAULT_ADMIN);
  logger.warn('Default admin created because no admin account existed', {
    email: DEFAULT_ADMIN.email,
  });

  return { created: true, email: DEFAULT_ADMIN.email };
};

export default ensureDefaultAdminExists;
