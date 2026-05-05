using Microsoft.Extensions.Options;
using MjmlEditor.Database.Configuration;
using MjmlEditor.Domain.BrandLibrary;
using MongoDB.Driver;

namespace MjmlEditor.Database.BrandLibrary;

internal sealed class MongoBrandLibraryRepository(
    IMongoDatabase database,
    IOptions<MongoDbOptions> options) : IBrandLibraryRepository
{
    private readonly IMongoCollection<BrandLibraryDocument> _collection =
        database.GetCollection<BrandLibraryDocument>(options.Value.BrandLibraryCollectionName);

    public async Task<Domain.BrandLibrary.BrandLibrary?> GetByTenantIdAsync(string tenantId, CancellationToken cancellationToken)
    {
        var doc = await _collection.Find(x => x.TenantId == tenantId).FirstOrDefaultAsync(cancellationToken);
        return doc is null ? null : MapToDomain(doc);
    }

    public async Task UpsertAsync(Domain.BrandLibrary.BrandLibrary brandLibrary, CancellationToken cancellationToken)
    {
        var doc = MapToDocument(brandLibrary);
        var filter = Builders<BrandLibraryDocument>.Filter.Eq(x => x.TenantId, brandLibrary.TenantId);
        await _collection.ReplaceOneAsync(filter, doc, new ReplaceOptions { IsUpsert = true }, cancellationToken);
    }

    private static Domain.BrandLibrary.BrandLibrary MapToDomain(BrandLibraryDocument doc)
    {
        return Domain.BrandLibrary.BrandLibrary.Restore(
            doc.TenantId,
            doc.SectionDefaultBackgroundColor,
            doc.DefaultLogoUrl,
            doc.DefaultLogoAltText,
            doc.Colors.Select(c => BrandColor.Restore(c.Name, c.Value)).ToArray(),
            doc.HeadingStyles.Select(h => BrandHeadingStyle.Restore(h.Level, h.FontFamily, h.FontSize, h.FontWeight, h.Color)).ToArray(),
            doc.TextStyles.Select(t => BrandTextStyle.Restore(t.Name, t.FontFamily, t.FontSize, t.FontWeight, t.Color)).ToArray(),
            doc.ButtonStyle is null ? null : BrandButtonStyle.Restore(
                doc.ButtonStyle.BackgroundColor,
                doc.ButtonStyle.TextColor,
                doc.ButtonStyle.BorderRadius,
                doc.ButtonStyle.FontFamily,
                doc.ButtonStyle.FontSize,
                doc.ButtonStyle.FontWeight));
    }

    private static BrandLibraryDocument MapToDocument(Domain.BrandLibrary.BrandLibrary library)
    {
        return new BrandLibraryDocument
        {
            TenantId = library.TenantId,
            SectionDefaultBackgroundColor = library.SectionDefaultBackgroundColor,
            DefaultLogoUrl = library.DefaultLogoUrl,
            DefaultLogoAltText = library.DefaultLogoAltText,
            Colors = library.Colors.Select(c => new BrandColorDocument { Name = c.Name, Value = c.Value }).ToArray(),
            HeadingStyles = library.HeadingStyles.Select(h => new BrandHeadingStyleDocument
            {
                Level = h.Level,
                FontFamily = h.FontFamily,
                FontSize = h.FontSize,
                FontWeight = h.FontWeight,
                Color = h.Color
            }).ToArray(),
            TextStyles = library.TextStyles.Select(t => new BrandTextStyleDocument
            {
                Name = t.Name,
                FontFamily = t.FontFamily,
                FontSize = t.FontSize,
                FontWeight = t.FontWeight,
                Color = t.Color
            }).ToArray(),
            ButtonStyle = library.ButtonStyle is null ? null : new BrandButtonStyleDocument
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
}
