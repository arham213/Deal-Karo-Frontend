"use client"

import FilterModal from "@/components/listings/FilterModal"
import { ListingDetailsModal } from "@/components/listings/ListingsDetailsModal"
import { PropertyCard } from "@/components/listings/PropertyCard"
import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, fontWeights, layoutStyles, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import type { ListingState } from "@/types/listings"
import { getToken, getUser } from "@/utils/secureStore"
import { showErrorToast, showInfoToast } from "@/utils/toast"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import axios from "axios"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function MyListingsScreen() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingState[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [activePropertyTab, setActivePropertyTab] = useState<"Plots" | "Houses" | "Commercial Plots">("Plots")
  const [activeFilter, setActiveFilter] = useState("All Listings")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [clickedListing, setClickedListing] = useState<ListingState>()
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const hasScrolledRef = useRef(false)
  const initialLoadCompleteRef = useRef(false)
  const isFetchingRef = useRef(false)
  const isSearchingRef = useRef(false)
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)
  const dropdownButtonRef = useRef<View>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 })

  const propertyTypeOptions: Array<"Plots" | "Houses" | "Commercial Plots"> = ["Plots", "Houses", "Commercial Plots"]
  const BASE_URL = "http://192.168.10.48:8080/api"

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus()
  }, [])

  const checkVerificationStatus = async () => {
    try {
      setLoadingUser(true)
      const token = await getToken()
      if (!token) {
        router.replace("/(auth)/sign-in")
        return
      }

      const response = await axios.get(`${BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        const userData = response.data.data.user
        setUser(userData)

        // Redirect to listings if not verified
        if (userData.verificationStatus !== "verified") {
          showInfoToast(
            "Your account needs to be verified by an admin to access this feature. Please wait for verification or contact support.",
            "Access Restricted"
          )
          setTimeout(() => {
            router.replace("/listings")
          }, 2000)
          return
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error)
      router.replace("/listings")
    } finally {
      setLoadingUser(false)
    }
  }

  // Helper function to check if we should use advanced search
  // Use advanced search if: filters are applied OR property type/active filter tabs are set
  const shouldUseAdvancedSearch = useCallback((filterObj: Record<string, any>, propertyTab: string, activeFilterTab: string) => {
    // Always use advanced search when property type or active filter tabs are set
    // (Even if they're the default values, we still need to filter by them)
    const hasPropertyTypeFilter = true // Always filter by property type
    const hasActiveFilter = activeFilterTab !== "All Listings"
    
    // Or if filters from modal are applied
    const hasFilters = filterObj && Object.keys(filterObj).length > 0
    
    return hasPropertyTypeFilter || hasActiveFilter || hasFilters
  }, [])

  // Helper function to transform filter values for backend
  const transformFiltersForBackend = useCallback((filterObj: Record<string, any>, propertyTab: string, activeFilterTab: string, userId?: string) => {
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
    if (userId) {
      params.userId = userId
    }

    // Phase (only include if not null/empty)
    if (filterObj.phase && filterObj.phase.trim() !== "") {
      params.phase = filterObj.phase
    }

    // Block (only include if not null/empty)
    if (filterObj.block && filterObj.block.trim() !== "") {
      params.block = filterObj.block
    }

    // Area - send selected area (backend accepts single area string)
    // Only include if area is selected and not "All"
    if (filterObj.selectedArea && filterObj.selectedArea !== "All") {
      params.area = filterObj.selectedArea
    }

    // Price range - extract numeric values (only include if not empty)
    if (filterObj.minPrice && filterObj.minPrice.trim() !== "") {
      const minPriceNum = filterObj.minPrice.replace(/[^0-9]/g, "")
      if (minPriceNum) {
        const parsed = parseInt(minPriceNum, 10)
        if (!isNaN(parsed)) params.minPrice = parsed
      }
    }
    if (filterObj.maxPrice && filterObj.maxPrice.trim() !== "") {
      const maxPriceNum = filterObj.maxPrice.replace(/[^0-9]/g, "")
      if (maxPriceNum) {
        const parsed = parseInt(maxPriceNum, 10)
        if (!isNaN(parsed)) params.maxPrice = parsed
      }
    }

    // Features - convert to backend format (only include if any feature is checked)
    // if (filterObj.features) {
    //   const featuresObj: Record<string, boolean> = {}
    //   if (filterObj.features["Don't have a pole"]) {
    //     featuresObj.hasPole = true
    //   }
    //   if (filterObj.features["No wire"]) {
    //     featuresObj.hasWire = true
    //   }
    //   if (Object.keys(featuresObj).length > 0) {
    //     params.features = JSON.stringify(featuresObj)
    //   }
    // }

    return params
  }, [])

  const getListings = useCallback(async (page: number = 1, reset: boolean = false, search: string = "", isSearch: boolean = false) => {
    // Prevent multiple simultaneous API calls
    if (isFetchingRef.current) {
      console.log("Already fetching, skipping...")
      return
    }

    const token = await getToken()

    if (!token) {
      console.error("Token missing")
      if (reset) {
        showErrorToast("Token missing. Please log in again.")
      }
      return
    }

    // Get userId from secureStore for my-listings
    const user = await getUser()
    const userId = user?._id

    if (!userId) {
      console.error("User ID missing")
      if (reset) {
        showErrorToast("User information missing. Please log in again.")
      }
      return
    }

    isFetchingRef.current = true
    isSearchingRef.current = isSearch

    // Don't show loading indicator for search operations
    if (reset && !isSearch) {
      setLoading(true)
    } else if (!isSearch) {
      setLoadingMore(true)
    }

    try {
      // Check if we should use advanced search
      const useAdvancedSearch = shouldUseAdvancedSearch(filters, activePropertyTab, activeFilter)
      let url = `${BASE_URL}/properties`
      let params: Record<string, any> = {
        page,
        limit: parseInt(process.env.PAGINATION_LIMIT || '25'),
      }

      if (search && search.trim()) {
        // Simple text search - use dedicated search endpoint but still apply all filters
        url = `${BASE_URL}/properties/search`
        params.searchString = search.trim()
        // Include userId and all filter params for my-listings
        const filterParams = transformFiltersForBackend(filters, activePropertyTab, activeFilter, userId)
        params = { ...params, ...filterParams }
      } else if (useAdvancedSearch) {
        // Use advanced search endpoint when property type, active filter, or filters are applied
        url = `${BASE_URL}/properties/search/advanced`
        const filterParams = transformFiltersForBackend(filters, activePropertyTab, activeFilter, userId)
        params = { ...params, ...filterParams }
      } else {
        // Default case: fetch my-properties with userId (no filters)
        url = `${BASE_URL}/properties/my-properties`
        params.userId = userId
      }

      const response = await axios.get(url, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('response:', response.data)

      isFetchingRef.current = false

      // Don't update loading state for search operations
      if (reset && !isSearch) {
        setLoading(false)
      } else if (!isSearch) {
        setLoadingMore(false)
      }

      if (response?.data.success) {
        const { properties, pagination } = response.data.data
        
        if (reset) {
          setListings(properties || [])
          initialLoadCompleteRef.current = true
          hasScrolledRef.current = false // Reset scroll tracking on new search/filter
          if (isSearch) {
            isSearchingRef.current = false // Reset search flag after search completes
          }
        } else {
          // Deduplicate listings by _id when appending
          setListings((prev) => {
            const existingIds = new Set(prev.map((item) => item._id))
            const newProperties = (properties || []).filter((item: ListingState) => !existingIds.has(item._id))
            return [...prev, ...newProperties]
          })
        }

        setCurrentPage(pagination?.page || 1)
        setTotalPages(pagination?.totalPages || 1)
        setHasMore((pagination?.page || 1) < (pagination?.totalPages || 1))
      } else {
        isFetchingRef.current = false
        if (reset && !isSearch) {
          setLoading(false)
        } else if (!isSearch) {
          setLoadingMore(false)
        }
        console.error("Failed to fetch my listings:", response?.data)
        // Only show toast if it's a reset (initial load or filter change), not for load more or search
        if (reset && !isSearch) {
          showErrorToast("Failed to fetch my listings")
        }
      }
    } catch (error) {
      isFetchingRef.current = false
      
      if (reset && !isSearch) {
        setLoading(false)
      } else if (!isSearch) {
        setLoadingMore(false)
      }

      console.error("Error fetching my listings:", error)
      
      // Only show toast for initial loads/resets, not for pagination failures or search
      // This prevents toast spam when scrolling or searching
      if (reset && !isSearch) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error?.response?.data?.error?.message || error?.message || 'An error occurred'
          // Use a small delay to prevent multiple toasts in quick succession
          setTimeout(() => {
            showErrorToast(errorMessage)
          }, 100)
        } else {
          setTimeout(() => {
            showErrorToast("Something went wrong. Please try again later")
          }, 100)
        }
      }
    }
  }, [filters, activePropertyTab, activeFilter, shouldUseAdvancedSearch, transformFiltersForBackend])

  // Initial load and handle filters, property tab, and active filter changes (immediate)
  // Only fetch listings if user is verified
  useEffect(() => {
    if (!loadingUser && user?.verificationStatus === "verified") {
      setCurrentPage(1)
      setTotalPages(1)
      setHasMore(true)
      setListings([])
      initialLoadCompleteRef.current = false // Reset initial load flag
      hasScrolledRef.current = false // Reset scroll tracking
      isFetchingRef.current = false // Reset fetching flag
      isSearchingRef.current = false // Reset search flag when filters change
      getListings(1, true, searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activePropertyTab, activeFilter, user, loadingUser])

  // Search effect - triggers immediately when searchQuery changes (not on initial mount)
  // Only fetch listings if user is verified
  const isInitialMount = useRef(true)
  useEffect(() => {
    // Skip if user is not verified or still loading
    if (loadingUser || user?.verificationStatus !== "verified") {
      return
    }

    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // If search query is empty, reset search flag and use normal loading
    const isSearch = searchQuery.trim().length > 0

    // Trigger search immediately when searchQuery changes
    setCurrentPage(1)
    setTotalPages(1)
    setHasMore(true)
    setListings([])
    initialLoadCompleteRef.current = false // Reset initial load flag
    hasScrolledRef.current = false // Reset scroll tracking
    isFetchingRef.current = false // Reset fetching flag
    getListings(1, true, searchQuery, isSearch) // Pass isSearch flag to prevent loading indicator only for actual searches

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, user, loadingUser])

  const loadMore = useCallback(() => {
    // Only load more if:
    // 1. Not already loading more
    // 2. Has more pages
    // 3. Initial load is complete
    // 4. User has scrolled (prevents immediate trigger on mount)
    if (!loadingMore && hasMore && !loading && initialLoadCompleteRef.current && hasScrolledRef.current) {
      getListings(currentPage + 1, false, searchQuery)
    }
  }, [loadingMore, hasMore, loading, currentPage, searchQuery, getListings])

  const handleScroll = useCallback((event: any) => {
    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true
    }

    // Proactively trigger loadMore when near the end
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const paddingToBottom = 400 // Trigger when 400px from bottom
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom

    if (isNearBottom && !loadingMore && hasMore && !loading && initialLoadCompleteRef.current) {
      loadMore()
    }
  }, [loadingMore, hasMore, loading, loadMore])

  const handleSearchChange = useCallback((text: string) => {
    setLocalSearchQuery(text)
    // Update search query immediately (no debounce for instant search like WhatsApp)
    setSearchQuery(text)
  }, [])

  const handlePropertyDetails = (listingId: string) => {
    const clickedListing = listings.filter((listing) => listing._id === listingId)
    setClickedListing(clickedListing[0])
    setShowDetailsModal(true)
  }

  // const PropertyCard = ({ property }: { property: ListingState }) => (
  //   <View style={styles.propertyCard}>
  //     {/* Content */}
  //     <View style={styles.propertyContent}>
  //       {/* Header with Title and Status */}
  //       <View style={styles.propertyHeader}>
  //         <View style={styles.titleSection}>
  //           <Text style={styles.propertyTitle}>
  //             {property.area} {property.propertyType}
  //           </Text>
  //           <View style={styles.locationRow}>
  //             <Ionicons name="location" size={12} color={Colors.textSecondary} />
  //             <Text style={styles.propertyLocation}>
  //               {property.block} {property.phase}
  //             </Text>
  //           </View>
  //         </View>
  //         {/* {property.} */}
  //         {property.listingType === "rent" ? (
  //           <Text style={styles.price}>Rs. {property.rentPerMonth}/month</Text>
  //         ) : (
  //           <Text style={styles.price}>Rs. {property.price || property.totalPrice}</Text>
  //         )}
  //       </View>

  //       {/* Meta Information */}
  //       <View style={styles.propertyMetaRow}>
  //         <View style={[styles.statusBadge, { backgroundColor: Colors.primary }]}>
  //           <Text style={styles.statusText}>{property.listingType}</Text>
  //         </View>
  //       </View>

  //       {/* Action Buttons */}
  //       <View style={styles.actionButtons}>
  //         <TouchableOpacity style={styles.detailsButton} onPress={() => handlePropertyDetails(property._id)}>
  //           <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
  //           <Text style={styles.actionButtonText}>Details</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   </View>
  // )

  const handleSetActivePropertyTab = useCallback((type: "Plots" | "Houses" | "Commercial Plots") => {
    setActivePropertyTab(type)
  }, [])

  const handleSetActiveFilter = useCallback((item: string) => {
    setActiveFilter(item)
  }, [])

  const handleOpenFilterModal = useCallback(() => {
    setShowFilterModal(true)
  }, [])

  // const ListHeader = (
  //   <>
  //     {/* Header Section */}
  //     <View style={styles.headerSection}>
  //       <View style={styles.userGreeting}>
  //         <MaterialCommunityIcons name="account-circle" size={32} color={Colors.text} />
  //         <View style={styles.greetingText}>
  //           <Text style={styles.greeting}>My Listings</Text>
  //           <Text style={styles.role}>Capital Estate</Text>
  //         </View>
  //       </View>

  //       {/* Property Type Tabs */}
  //       <View style={styles.propertyTypeTabs}>
  //         {["Plots", "Houses", "Commercial Plots"].map((type) => (
  //           <TouchableOpacity
  //             key={type}
  //             style={[styles.typeTab, activePropertyTab === type && styles.activeTypeTab]}
  //             onPress={() => handleSetActivePropertyTab(type as "Plots" | "Houses" | "Commercial Plots")}
  //           >
  //             <Text style={[styles.typeTabText, activePropertyTab === type && styles.activeTypeTabText]}>{type}</Text>
  //           </TouchableOpacity>
  //         ))}
  //       </View>
  //     </View>

  //     {/* Search and Filter Bar */}
  //     <View style={styles.searchFilterBar}>
  //       <View style={styles.searchInputContainer}>
  //         <Ionicons name="search" size={18} color={Colors.placeholder} />
  //         <RNTextInput
  //           style={styles.searchInput}
  //           placeholder="Search listings..."
  //           placeholderTextColor={Colors.placeholder}
  //           value={localSearchQuery}
  //           onChangeText={handleSearchChange}
  //           returnKeyType="search"
  //           autoCorrect={false}
  //           autoCapitalize="none"
  //         />
  //       </View>
  //       <TouchableOpacity style={styles.filterIconButton} onPress={handleOpenFilterModal}>
  //         <MaterialCommunityIcons name="tune" size={18} color={Colors.text} />
  //       </TouchableOpacity>
  //     </View>

  //     <FlatList
  //       horizontal
  //       scrollEnabled
  //       data={["All Listings", "For cash", "Installments"]}
  //       keyExtractor={(item) => item}
  //       contentContainerStyle={styles.filterCategoryScroll}
  //       showsHorizontalScrollIndicator={false}
  //       renderItem={({ item }) => (
  //         <TouchableOpacity
  //           style={[styles.filterCategoryTab, activeFilter === item && styles.activeFilterCategoryTab]}
  //           onPress={() => handleSetActiveFilter(item)}
  //         >
  //           <Text style={[styles.filterCategoryText, activeFilter === item && styles.activeFilterCategoryText]}>
  //             {item}
  //           </Text>
  //         </TouchableOpacity>
  //       )}
  //     />
  //   </>
  // )

  const ListHeader = () => {
    return (
    <View style={{ marginBottom: activePropertyTab === "Houses" ? spacing.lg : 0 }}>
      <View style={styles.header}>
      {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.userGreeting}>
            <MaterialCommunityIcons name="account-circle" size={32} color={Colors.text} />
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>My Listings</Text>
              <Text style={styles.role}>Capital Estate</Text>
            </View>
          </View>

          {/* Property Type Dropdown */}
          <View style={styles.propertyTypeDropdownWrapper} ref={dropdownButtonRef}>
            <TouchableOpacity
              style={styles.propertyTypeDropdownButton}
              activeOpacity={0.85}
              onPress={() => {
                dropdownButtonRef.current?.measureInWindow((x, y, width, height) => {
                  setDropdownPosition({ x, y: y + height, width })
                  setShowPropertyTypeDropdown(true)
                })
              }}
            >
              <Text style={styles.propertyTypeDropdownText}>{activePropertyTab === "Commercial Plots" ? "Commercial" : activePropertyTab}</Text>
              <Ionicons
                name={showPropertyTypeDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color={Colors.black} />
            <RNTextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.black}
              value={localSearchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              blurOnSubmit={false}
            />
          <TouchableOpacity style={styles.filterIconButton} onPress={handleOpenFilterModal}>
            <MaterialCommunityIcons name="tune" size={18} color={Colors.text} />
          </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {activePropertyTab !== "Houses" && (
        <FlatList
        horizontal
        scrollEnabled
        data={["All Listings", "For cash", "Installments"]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterCategoryScroll}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterCategoryTab, activeFilter === item && styles.activeFilterCategoryTab]}
            onPress={() => handleSetActiveFilter(item)}
          >
            <Text style={[styles.filterCategoryText, activeFilter === item && styles.activeFilterCategoryText]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />)}
    </View>)
  }

  // Show loading while checking verification
  if (loadingUser) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, styles.safeArea]}>
        <View style={styles.initialLoadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.initialLoadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Don't render if user is not verified (will redirect)
  if (user?.verificationStatus !== "verified") {
    return null
  }

  return (
    <SafeAreaView style={[layoutStyles.safeArea, styles.safeArea]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        {loading && listings.length === 0 && !isSearchingRef.current ? (
          <View style={styles.initialLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.initialLoadingText}>Loading listings...</Text>
          </View>
        ) : (
          <>
          <ListHeader />
          <FlatList
            data={listings}
            keyExtractor={(item, index) => item._id || `listing-${index}`}
            renderItem={({ item }) => <PropertyCard property={item} user={{ verificationStatus: "verified" } as User} handlePropertyDetails={handlePropertyDetails} />}
            // ListHeaderComponent={ListHeader}
            ListFooterComponent={
              loadingMore && listings.length > 0 ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : !hasMore && listings.length > 0 && !loadingMore && !isFetchingRef.current ? (
                <View style={styles.endOfListContainer}>
                  <Text style={styles.endOfListText}>No more listings to load</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading && !isFetchingRef.current && !isSearchingRef.current && listings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No listings found</Text>
                </View>
              ) : null
            }
            contentContainerStyle={styles.container}
            scrollEnabled
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.7}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          </>
        )}
      </KeyboardAvoidingView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(appliedFilters: any) => {
          setFilters(appliedFilters)
          setShowFilterModal(false)
        }}
        propertyType={activePropertyTab}
      />

      <ListingDetailsModal
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        listing={clickedListing}
      />

      <Modal
        transparent
        visible={showPropertyTypeDropdown}
        animationType="fade"
        onRequestClose={() => setShowPropertyTypeDropdown(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.dropdownBackdrop}
          onPress={() => setShowPropertyTypeDropdown(false)}
        >
          <View style={[styles.dropdownContent, { left: dropdownPosition.x, top: dropdownPosition.y }]}>
            {propertyTypeOptions.map((type) => (
              <TouchableOpacity
                key={type}
                activeOpacity={0.8}
                style={[
                  styles.dropdownOption,
                  activePropertyTab === type && styles.selectedDropdownOption,
                ]}
                onPress={() => {
                  handleSetActivePropertyTab(type)
                  setShowPropertyTypeDropdown(false)
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    activePropertyTab === type && styles.selectedDropdownOptionText,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    borderBottomRightRadius: 48,
    borderBottomLeftRadius: 48,
    backgroundColor: Colors.neutral10,
    backdropFilter: "blur(2px)",
    padding: spacing.screen,
  },
  safeArea: {
    flex: 1,
    // backgroundColor: Colors.headerBackground,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.headerBackground,
  },
  container: {
    paddingBottom: 70,
    // padding: spacing.screen,
  },
  accountVerificationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF4DB",
    borderRadius: 12,
  },
  accountVerificationText: {
    fontSize: 12,
    color: "#8A6000",
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greetingText: {
    justifyContent: "center",
  },
  greeting: {
    color: Colors.black,
    textAlign: "center",
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontStyle: "normal",
    fontWeight: fontWeights.medium,
    letterSpacing: 0.14

  },
  role: {
    color: Colors.neutral80,
    // textAlign: "center",
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xs,
    fontStyle: "normal",
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.12
  },
  propertyTypeDropdownWrapper: {
    alignSelf: "flex-start",
  },
  propertyTypeDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral60,
    backgroundColor: Colors.neutral10,
    gap: 10,
    // minWidth: 140
    // height: 36,
  },
  propertyTypeDropdownText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: Colors.text,
    fontStyle: "normal",
    fontFamily: fontFamilies.primary,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  dropdownContent: {
    position: "absolute",
    minWidth: 180,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedDropdownOption: {
    backgroundColor: Colors.inputBackground,
  },
  selectedDropdownOptionText: {
    fontWeight: "600",
  },
  searchFilterBar: {
    flexDirection: "row",
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 14,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.placeholder,
  },
  filterIconButton: {
    // width: 44,
    // height: 44,
    // // borderRadius: 12,
    // // backgroundColor: Colors.inputBackground,
    // // borderWidth: 1,
    // // borderColor: Colors.border,
    // justifyContent: "center",
    // alignItems: "center",
    transform: [{ rotate: "90deg" }],
  },
  filterCategoryScroll: {
    paddingHorizontal: spacing.screen,
    paddingVertical: 16,
    gap: 8,
  },
  filterCategoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
    backgroundColor: Colors.neutral10,
    borderWidth: 1,
    borderColor: Colors.neutral60,
  },
  activeFilterCategoryTab: {
    backgroundColor: Colors.neutral30,
  },
  filterCategoryText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    color: Colors.text,
    fontFamily: fontFamilies.primary,
  },
  activeFilterCategoryText: {
    fontWeight: fontWeights.semibold,
  },
  propertyCard: {
    backgroundColor: Colors.neutral10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral40,
    overflow: "hidden",
    marginHorizontal: spacing.screen,
    marginBottom: spacing.md,
  },
  propertyImageContainer: {
    height: 140,
    backgroundColor: Colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  propertyContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    flex: 1,
    gap: spacing.sm,
  },
  propertyTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  propertyLocation: {
    fontSize: fontSizes.xs,
    color: Colors.neutral80,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    fontWeight: fontWeights.medium,
    letterSpacing: 0.12,
  },
  statusBadgeCash: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: Colors.backgroundCash,
  },
  statusTextCash: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: Colors.textCash,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.12,
  },
  statusBadgeInstallments: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: Colors.backgroundInstallments,
  },
  statusTextInstallments: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: Colors.textInstallments,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.12,
  },
  propertyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addedByLabel: {
    fontSize: fontSizes.xs,
    color: Colors.neutral80,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    fontWeight: fontWeights.medium,
    letterSpacing: 0.12,
  },
  price: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
  },
  addedByDetailsContainer: {
    flexDirection: "column",
    gap: spacing.xxxs,
  },
  addedByContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addedBy: {
    fontSize: fontSizes.sm,
    color: Colors.neutral100,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.14,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xs,
    backgroundColor: Colors.neutral20,
    borderRadius: radius.lg,
  },
  actionButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral90,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.14,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endOfListText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  initialLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  initialLoadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
})