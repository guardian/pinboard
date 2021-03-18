// FIXME: phase this out and store just email addresses for user in the database
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}
