using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

public interface IEmailTemplateMjmlGenerator
{
    string Generate(EmailTemplateEditorDocument document);
}
