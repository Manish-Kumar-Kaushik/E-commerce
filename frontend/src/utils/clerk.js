export const getClerkPrimaryEmail = (user) =>
  user?.primaryEmailAddress?.emailAddress ||
  user?.emailAddresses?.[0]?.emailAddress ||
  user?.emailAddress ||
  ''

export const getClerkPrimaryPhone = (user) =>
  user?.primaryPhoneNumber?.phoneNumber ||
  user?.phoneNumbers?.[0]?.phoneNumber ||
  user?.phoneNumber ||
  ''

export const getClerkDisplayName = (user) =>
  user?.fullName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
  user?.username ||
  getClerkPrimaryEmail(user).split('@')[0] ||
  'Customer'

export const buildClerkSyncPayload = (user = {}, role = 'customer') => ({
  clerkId: user?.id || '',
  email: getClerkPrimaryEmail(user),
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  name: getClerkDisplayName(user),
  phone: getClerkPrimaryPhone(user),
  role,
})
