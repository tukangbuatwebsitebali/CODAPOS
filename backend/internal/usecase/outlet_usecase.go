package usecase

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type OutletUsecase struct {
	outletRepo domain.OutletRepository
	brandRepo  domain.BrandRepository
	regionRepo domain.RegionRepository
}

func NewOutletUsecase(or domain.OutletRepository, br domain.BrandRepository, rr domain.RegionRepository) *OutletUsecase {
	return &OutletUsecase{outletRepo: or, brandRepo: br, regionRepo: rr}
}

// Outlet operations
func (u *OutletUsecase) CreateOutlet(outlet *domain.Outlet) error {
	return u.outletRepo.Create(outlet)
}

func (u *OutletUsecase) GetOutlets(tenantID uuid.UUID) ([]domain.Outlet, error) {
	return u.outletRepo.FindByTenantID(tenantID)
}

func (u *OutletUsecase) GetOutlet(id uuid.UUID) (*domain.Outlet, error) {
	return u.outletRepo.FindByID(id)
}

func (u *OutletUsecase) UpdateOutlet(outlet *domain.Outlet) error {
	return u.outletRepo.Update(outlet)
}

func (u *OutletUsecase) DeleteOutlet(id uuid.UUID) error {
	return u.outletRepo.Delete(id)
}

// Brand operations
func (u *OutletUsecase) CreateBrand(brand *domain.Brand) error {
	return u.brandRepo.Create(brand)
}

func (u *OutletUsecase) GetBrands(tenantID uuid.UUID) ([]domain.Brand, error) {
	return u.brandRepo.FindByTenantID(tenantID)
}

func (u *OutletUsecase) UpdateBrand(brand *domain.Brand) error {
	return u.brandRepo.Update(brand)
}

// Region operations
func (u *OutletUsecase) CreateRegion(region *domain.Region) error {
	return u.regionRepo.Create(region)
}

func (u *OutletUsecase) GetRegions(tenantID uuid.UUID) ([]domain.Region, error) {
	return u.regionRepo.FindByTenantID(tenantID)
}
