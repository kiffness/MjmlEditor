namespace MjmlEditor.Application.Auth;

public interface IUserPasswordHasher
{
    string HashPassword(string password);

    bool VerifyHashedPassword(string passwordHash, string providedPassword);
}
