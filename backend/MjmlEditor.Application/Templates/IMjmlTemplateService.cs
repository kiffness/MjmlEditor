using MjmlEditor.Application.Contracts.Templates;

namespace MjmlEditor.Application.Templates;

public interface IMjmlTemplateService
{
    Task<RenderMjmlResponse> RenderAsync(RenderMjmlRequest request, CancellationToken cancellationToken);

    Task<RenderMjmlResponse> RenderByTemplateIdAsync(string id, CancellationToken cancellationToken);

    Task<TranslateHtmlResponse> TranslateHtmlAsync(TranslateHtmlRequest request, CancellationToken cancellationToken);
}
