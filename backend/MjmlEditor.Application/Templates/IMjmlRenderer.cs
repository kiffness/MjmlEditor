namespace MjmlEditor.Application.Templates;

public interface IMjmlRenderer
{
    Task<MjmlRenderResult> RenderAsync(string mjmlBody, CancellationToken cancellationToken);
}
