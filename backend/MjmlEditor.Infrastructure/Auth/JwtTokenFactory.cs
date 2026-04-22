using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MjmlEditor.Application.Auth;
using MjmlEditor.Domain.Users;

namespace MjmlEditor.Infrastructure.Auth;

internal sealed class JwtTokenFactory(IOptions<JwtOptions> options) : IJwtTokenFactory
{
    private readonly JwtOptions jwtOptions = options.Value;

    public JwtAccessToken CreateToken(UserAccount userAccount)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(jwtOptions.TokenLifetimeMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userAccount.Id),
            new Claim(ClaimTypes.Email, userAccount.Email),
            new Claim(ClaimTypes.Name, userAccount.DisplayName)
        };

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        return new JwtAccessToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAtUtc);
    }
}
