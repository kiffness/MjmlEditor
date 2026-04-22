namespace MjmlEditor.Domain.Templates;

public enum EmailTemplateRevisionEvent
{
    Created = 1,
    DraftSaved = 2,
    Published = 3,
    RolledBack = 4,
    Archived = 5
}
