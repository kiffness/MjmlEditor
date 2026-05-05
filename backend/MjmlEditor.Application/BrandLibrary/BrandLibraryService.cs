using MjmlEditor.Application.Contracts.BrandLibrary;
using MjmlEditor.Application.Tenancy;
using MjmlEditor.Domain.BrandLibrary;

namespace MjmlEditor.Application.BrandLibrary;

internal sealed class BrandLibraryService(
    IBrandLibraryRepository repository,
    ITenantContextAccessor tenantContextAccessor) : IBrandLibraryService
{
    public async Task<BrandLibraryDto> GetAsync(CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var library = await repository.GetByTenantIdAsync(tenantId, cancellationToken);
        return library is null ? new BrandLibraryDto() : MapToDto(library);
    }

    public async Task<BrandLibraryDto> SaveAsync(BrandLibraryDto dto, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();

        var colors = dto.Colors.Select(c => BrandColor.Create(c.Name, c.Value)).ToArray();
        var headingStyles = dto.HeadingStyles.Select(h => BrandHeadingStyle.Create(h.Level, h.FontFamily, h.FontSize, h.FontWeight, h.Color)).ToArray();
        var textStyles = dto.TextStyles.Select(t => BrandTextStyle.Create(t.Name, t.FontFamily, t.FontSize, t.FontWeight, t.Color)).ToArray();
        var buttonStyle = dto.ButtonStyle is null
            ? null
            : BrandButtonStyle.Create(
                dto.ButtonStyle.BackgroundColor,
                dto.ButtonStyle.TextColor,
                dto.ButtonStyle.BorderRadius,
                dto.ButtonStyle.FontFamily,
                dto.ButtonStyle.FontSize,
                dto.ButtonStyle.FontWeight);

        var library = Domain.BrandLibrary.BrandLibrary.Create(tenantId, dto.SectionDefaultBackgroundColor, dto.DefaultLogoUrl, dto.DefaultLogoAltText, colors, headingStyles, textStyles, buttonStyle);
        await repository.UpsertAsync(library, cancellationToken);
        return MapToDto(library);
    }

    private static BrandLibraryDto MapToDto(Domain.BrandLibrary.BrandLibrary library) =>
        new()
        {
            SectionDefaultBackgroundColor = library.SectionDefaultBackgroundColor,
            DefaultLogoUrl = library.DefaultLogoUrl,
            DefaultLogoAltText = library.DefaultLogoAltText,
            Colors = library.Colors.Select(c => new BrandColorDto { Name = c.Name, Value = c.Value }).ToArray(),
            HeadingStyles = library.HeadingStyles.Select(h => new BrandHeadingStyleDto
            {
                Level = h.Level,
                FontFamily = h.FontFamily,
                FontSize = h.FontSize,
                FontWeight = h.FontWeight,
                Color = h.Color
            }).ToArray(),
            TextStyles = library.TextStyles.Select(t => new BrandTextStyleDto
            {
                Name = t.Name,
                FontFamily = t.FontFamily,
                FontSize = t.FontSize,
                FontWeight = t.FontWeight,
                Color = t.Color
            }).ToArray(),
            ButtonStyle = library.ButtonStyle is null ? null : new BrandButtonStyleDto
            {
                BackgroundColor = library.ButtonStyle.BackgroundColor,
                TextColor = library.ButtonStyle.TextColor,
                BorderRadius = library.ButtonStyle.BorderRadius,
                FontFamily = library.ButtonStyle.FontFamily,
                FontSize = library.ButtonStyle.FontSize,
                FontWeight = library.ButtonStyle.FontWeight
            }
        };
}
