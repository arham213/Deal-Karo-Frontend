export type PropertyTypeTab = "Plots" | "Houses" | "Commercial Plots"

export type ActiveFilterTab = "All Listings" | "For cash" | "Installments"

export type ListingsFilters = Record<string, any>

/**
 * Decide whether to use the advanced search endpoint.
 * Uses advanced search if filters are applied OR property type / active filter tabs are set.
 */
export const shouldUseAdvancedSearch = (
  filterObj: ListingsFilters,
  _propertyTab: PropertyTypeTab,
  activeFilterTab: ActiveFilterTab,
): boolean => {
  // Always use advanced search when property type or active filter tabs are set
  // (Even if they're the default values, we still need to filter by them)
  const hasPropertyTypeFilter = true // Always filter by property type
  const hasActiveFilter = activeFilterTab !== "All Listings"

  // Or if filters from modal are applied
  const hasFilters = filterObj && Object.keys(filterObj).length > 0

  return hasPropertyTypeFilter || hasActiveFilter || hasFilters
}

/**
 * Transform UI filter values into backend query params.
 */
export const transformFiltersForBackend = (
  filterObj: ListingsFilters,
  propertyTab: PropertyTypeTab,
  activeFilterTab: ActiveFilterTab,
): Record<string, any> => {
  const params: Record<string, any> = {}

  // Map propertyType from activePropertyTab (always include)
  if (propertyTab === "Plots") {
    params.propertyType = "plot"
  } else if (propertyTab === "Houses") {
    params.propertyType = "house"
  } else if (propertyTab === "Commercial Plots") {
    params.propertyType = "commercial plot"
  }

  // Map listingType from activeFilterTab (if not "All Listings")
  if (activeFilterTab === "For cash") {
    params.listingType = "cash"
  } else if (activeFilterTab === "Installments") {
    params.listingType = "installments"
  }
  // "All Listings" means no listingType filter

  // Map listingType from typeOfPlot in filterObj (only if typeOfPlot is set and activeFilterTab is "All Listings")
  // This allows filter modal to override the activeFilterTab
  if (filterObj.typeOfPlot && activeFilterTab === "All Listings") {
    if (filterObj.typeOfPlot === "On Cash") {
      params.listingType = "cash"
    } else if (filterObj.typeOfPlot === "On Installments") {
      params.listingType = "installments"
    }
  }

  // Phase (only include if not null/empty)
  if (filterObj.phase && typeof filterObj.phase === "string" && filterObj.phase.trim() !== "") {
    params.phase = filterObj.phase
  }

  // Block (only include if not null/empty)
  if (filterObj.block && typeof filterObj.block === "string" && filterObj.block.trim() !== "") {
    params.block = filterObj.block
  }

  // Area - send selected area (backend accepts single area string)
  // Only include if area is selected and not "All"
  if (filterObj.selectedArea && filterObj.selectedArea !== "All") {
    params.area = filterObj.selectedArea
  }

  // Price range - extract numeric values (only include if not default values)
  if (filterObj.minPrice && filterObj.minPrice !== "Rs.1 Crore") {
    const minPriceNum = String(filterObj.minPrice).replace(/[^0-9]/g, "")
    if (minPriceNum) {
      const parsed = parseInt(minPriceNum, 10)
      if (!Number.isNaN(parsed)) params.minPrice = parsed
    }
  }

  if (filterObj.maxPrice && filterObj.maxPrice !== "Rs. 2 Crore") {
    const maxPriceNum = String(filterObj.maxPrice).replace(/[^0-9]/g, "")
    if (maxPriceNum) {
      const parsed = parseInt(maxPriceNum, 10)
      if (!Number.isNaN(parsed)) params.maxPrice = parsed
    }
  }

  return params
}

export interface BuildListingsRequestOptions {
  page: number
  limit: number
  search?: string
  filters: ListingsFilters
  propertyTab: PropertyTypeTab
  activeFilterTab: ActiveFilterTab
}

export interface ListingsRequestConfig {
  url: string
  params: Record<string, any>
}

/**
 * Build URL and query params for listings API requests.
 * This isolates URL/param logic so it can be shared between mobile and web apps.
 */
export const buildListingsRequest = ({
  page,
  limit,
  search,
  filters,
  propertyTab,
  activeFilterTab,
}: BuildListingsRequestOptions): ListingsRequestConfig => {
  const useAdvancedSearch = shouldUseAdvancedSearch(filters, propertyTab, activeFilterTab)

  let url = "/properties"
  let params: Record<string, any> = {
    page,
    limit,
  }

  if (useAdvancedSearch && !(search && search.trim())) {
    // Use advanced search endpoint when property type, active filter, or filters are applied
    url = "/properties/search/advanced"
    const filterParams = transformFiltersForBackend(filters, propertyTab, activeFilterTab)
    params = { ...params, ...filterParams }
  } else if (search && search.trim()) {
    // Simple text search - use dedicated search endpoint (with basic filters)
    url = "/properties/search"
    params.searchString = search.trim()
    const filterParams = transformFiltersForBackend(filters, propertyTab, activeFilterTab)
    const { propertyType, listingType } = filterParams
    params = { ...params, propertyType, listingType }
  }

  return { url, params }
}

export interface BuildMyListingsRequestOptions {
  page: number
  limit: number
  search?: string
  filters: ListingsFilters
  propertyTab: PropertyTypeTab
  activeFilterTab: ActiveFilterTab
  userId: string
}

export const transformFiltersForMyListingsBackend = (
  filterObj: ListingsFilters,
  propertyTab: PropertyTypeTab,
  activeFilterTab: ActiveFilterTab,
  userId: string,
): Record<string, any> => {
  const params: Record<string, any> = {}

  // Map propertyType from activePropertyTab (always include)
  if (propertyTab === "Plots") {
    params.propertyType = "plot"
  } else if (propertyTab === "Houses") {
    params.propertyType = "house"
  } else if (propertyTab === "Commercial Plots") {
    params.propertyType = "commercial plot"
  }

  // Map listingType from activeFilterTab (if not "All Listings")
  if (activeFilterTab === "For cash") {
    params.listingType = "cash"
  } else if (activeFilterTab === "Installments") {
    params.listingType = "installments"
  }
  // "All Listings" means no listingType filter

  // Map listingType from typeOfPlot in filterObj (only if typeOfPlot is set and activeFilterTab is "All Listings")
  // This allows filter modal to override the activeFilterTab
  if (filterObj.typeOfPlot && activeFilterTab === "All Listings") {
    if (filterObj.typeOfPlot === "On Cash") {
      params.listingType = "cash"
    } else if (filterObj.typeOfPlot === "On Installments") {
      params.listingType = "installments"
    }
  }

  // Include userId for my-listings screen
  params.userId = userId

  // Phase (only include if not null/empty)
  if (filterObj.phase && typeof filterObj.phase === "string" && filterObj.phase.trim() !== "") {
    params.phase = filterObj.phase
  }

  // Block (only include if not null/empty)
  if (filterObj.block && typeof filterObj.block === "string" && filterObj.block.trim() !== "") {
    params.block = filterObj.block
  }

  // Area - send selected area (backend accepts single area string)
  // Only include if area is selected and not "All"
  if (filterObj.selectedArea && filterObj.selectedArea !== "All") {
    params.area = filterObj.selectedArea
  }

  // Price range - extract numeric values (only include if not empty)
  if (filterObj.minPrice && String(filterObj.minPrice).trim() !== "") {
    const minPriceNum = String(filterObj.minPrice).replace(/[^0-9]/g, "")
    if (minPriceNum) {
      const parsed = parseInt(minPriceNum, 10)
      if (!Number.isNaN(parsed)) params.minPrice = parsed
    }
  }

  if (filterObj.maxPrice && String(filterObj.maxPrice).trim() !== "") {
    const maxPriceNum = String(filterObj.maxPrice).replace(/[^0-9]/g, "")
    if (maxPriceNum) {
      const parsed = parseInt(maxPriceNum, 10)
      if (!Number.isNaN(parsed)) params.maxPrice = parsed
    }
  }

  return params
}

export const buildMyListingsRequest = ({
  page,
  limit,
  search,
  filters,
  propertyTab,
  activeFilterTab,
  userId,
}: BuildMyListingsRequestOptions): ListingsRequestConfig => {
  const useAdvancedSearch = shouldUseAdvancedSearch(filters, propertyTab, activeFilterTab)

  let url = "/properties/my-properties"
  let params: Record<string, any> = {
    page,
    limit,
    userId,
  }

  if (search && search.trim()) {
    // Simple text search - use dedicated search endpoint but still apply all filters
    url = "/properties/search"
    params.searchString = search.trim()
    const filterParams = transformFiltersForMyListingsBackend(
      filters,
      propertyTab,
      activeFilterTab,
      userId,
    )
    params = { ...params, ...filterParams }
  } else if (useAdvancedSearch) {
    // Use advanced search endpoint when property type, active filter, or filters are applied
    url = "/properties/search/advanced"
    const filterParams = transformFiltersForMyListingsBackend(
      filters,
      propertyTab,
      activeFilterTab,
      userId,
    )
    params = { ...params, ...filterParams }
  }

  return { url, params }
}



