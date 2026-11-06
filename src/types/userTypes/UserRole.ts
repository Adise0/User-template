// SUPERUSER can only be set directly in the database, no endpoint can grant it.
enum UserRole {
  user = "USER",
  admin = "ADMIN",
  superuser = "SUPERUSER",
}

export default UserRole;
