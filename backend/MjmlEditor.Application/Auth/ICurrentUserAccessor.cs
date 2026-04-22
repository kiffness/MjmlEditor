namespace MjmlEditor.Application.Auth;

public interface ICurrentUserAccessor
{
    string GetRequiredUserId();
}
