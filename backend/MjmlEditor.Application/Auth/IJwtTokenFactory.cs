using MjmlEditor.Domain.Users;

namespace MjmlEditor.Application.Auth;

public interface IJwtTokenFactory
{
    JwtAccessToken CreateToken(UserAccount userAccount);
}
