using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

public interface IEmailTemplateMjmlGenerator
{
    /// <summary>
    /// Generates a full MJML document from the structured visual-editor model.
    /// </summary>
    /// <param name="document">The editor document to convert into canonical MJML.</param>
    /// <returns>A complete MJML document string.</returns>
    string Generate(EmailTemplateEditorDocument document);
}
