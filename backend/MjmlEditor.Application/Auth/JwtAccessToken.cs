namespace MjmlEditor.Application.Auth;

public sealed record JwtAccessToken(
    string Value,
    DateTimeOffset ExpiresAtUtc);
