using MjmlEditor.Application.Contracts.BrandLibrary;

namespace MjmlEditor.Application.BrandLibrary;

public interface IBrandLibraryService
{
    Task<BrandLibraryDto> GetAsync(CancellationToken cancellationToken);
    Task<BrandLibraryDto> SaveAsync(BrandLibraryDto dto, CancellationToken cancellationToken);
}
