"use client"

import FilterModal from "@/components/listings/FilterModal"
import { ListingDetailsModal } from "@/components/listings/ListingsDetailsModal"
import { PropertyCard } from "@/components/listings/PropertyCard"
import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import type { ListingState } from "@/types/listings"
import { getToken } from "@/utils/secureStore"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import axios from "axios"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ListingsScreen() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<ListingState[]>([])
  const [activePropertyTab, setActivePropertyTab] = useState<"Plots" | "Houses" | "Commercial Plots">("Plots")
  const [activeFilter, setActiveFilter] = useState("All Listings")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [clickedListing, setClickedListing] = useState<ListingState>()
  const [filters, setFilters] = useState({})
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasScrolledRef = useRef(false)
  const initialLoadCompleteRef = useRef(false)
  const isFetchingRef = useRef(false)

  const propertyTypeOptions: Array<"Plots" | "Houses" | "Commercial Plots"> = ["Plots", "Houses", "Commercial Plots"]
  const BASE_URL = "http://10.190.83.91:8080/api"

  useEffect(() => {
    getUserFromSecureStore()
  }, [])

  const getUserFromSecureStore = async () => {
    // const user = await getUser()
    // if (user) {
    //   setUser(user)
    // }

    setLoading(true)
    try {
      const token = await getToken()
      if (!token) {
        console.error("Token missing")
        throw new Error("Token missing")
      }

      const response = await axios.get(`${BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log('response:', response.data);
      if (response.data.success) {
        setUser(response.data.data.user)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
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
  const transformFiltersForBackend = useCallback((filterObj: Record<string, any>, propertyTab: string, activeFilterTab: string) => {
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

    // Price range - extract numeric values (only include if not default values)
    if (filterObj.minPrice && filterObj.minPrice !== "Rs.1 Crore") {
      const minPriceNum = filterObj.minPrice.replace(/[^0-9]/g, "")
      if (minPriceNum) {
        const parsed = parseInt(minPriceNum, 10)
        if (!isNaN(parsed)) params.minPrice = parsed
      }
    }
    if (filterObj.maxPrice && filterObj.maxPrice !== "Rs. 2 Crore") {
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

  const getListings = useCallback(async (page: number = 1, reset: boolean = false, search: string = "") => {
    // Prevent multiple simultaneous API calls
    if (isFetchingRef.current) {
      console.log("Already fetching, skipping...")
      return
    }

    const token = await getToken()

    if (!token) {
      console.error("Token missing")
      if (reset) {
        alert("Token missing. Please log in again.")
      }
      return
    }

    isFetchingRef.current = true

    if (reset) {
      setLoading(true)
    } else {
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

      if (useAdvancedSearch && !(search && search.trim())) {
        // Use advanced search endpoint when property type, active filter, or filters are applied
        url = `${BASE_URL}/properties/search/advanced`
        const filterParams = transformFiltersForBackend(filters, activePropertyTab, activeFilter)
        params = { ...params, ...filterParams }
      } else if (search && search.trim()) {
        // Simple text search - use dedicated search endpoint (only when no filters/tabs are set)
        url = `${BASE_URL}/properties/search`
        params.searchString = search.trim()
        const filterParams = transformFiltersForBackend(filters, activePropertyTab, activeFilter)
        const { propertyType, listingType, ...rest } = filterParams
        params = { ...params, propertyType, listingType }
      }

      const response = await axios.get(url, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('response:', response.data);

      isFetchingRef.current = false

      if (reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }

      if (response?.data.success) {
        const { properties, pagination } = response.data.data
        
        if (reset) {
          setListings(properties || [])
          initialLoadCompleteRef.current = true
          hasScrolledRef.current = false // Reset scroll tracking on new search/filter
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
        if (reset) {
          setLoading(false)
        } else {
          setLoadingMore(false)
        }
        console.error("Failed to fetch listings:", response?.data)
        // Only show alert if it's a reset (initial load or filter change), not for load more
        if (reset) {
          alert("Failed to fetch listings")
        }
      }
    } catch (error) {
      isFetchingRef.current = false
      
      if (reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }

      console.error("Error fetching listings:", error)
      
      // Only show alert for initial loads/resets, not for pagination failures
      // This prevents alert spam when scrolling
      if (reset) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error?.response?.data?.error?.message || error?.message || 'An error occurred'
          // Use a small delay to prevent multiple alerts in quick succession
          setTimeout(() => {
            alert(errorMessage)
          }, 100)
        } else {
          setTimeout(() => {
            alert("Something went wrong. Please try again later")
          }, 100)
        }
      }
    }
  }, [filters, activePropertyTab, activeFilter, shouldUseAdvancedSearch, transformFiltersForBackend])

  // Initial load and handle filters, property tab, and active filter changes (immediate)
  useEffect(() => {
    setCurrentPage(1)
    setTotalPages(1)
    setHasMore(true)
    setListings([])
    initialLoadCompleteRef.current = false // Reset initial load flag
    hasScrolledRef.current = false // Reset scroll tracking
    isFetchingRef.current = false // Reset fetching flag
    getListings(1, true, searchQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activePropertyTab, activeFilter])

  // Debounced search effect - only triggers when searchQuery changes (not on initial mount)
  const isInitialMount = useRef(true)
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Trigger search immediately when searchQuery changes (already debounced in handleSearchChange)
    setCurrentPage(1)
    setTotalPages(1)
    setHasMore(true)
    setListings([])
    initialLoadCompleteRef.current = false // Reset initial load flag
    hasScrolledRef.current = false // Reset scroll tracking
    isFetchingRef.current = false // Reset fetching flag
    getListings(1, true, searchQuery)

    // Cleanup timeout on unmount or when searchQuery changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

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
    // Update the actual search query after debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(text)
    }, 500)
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
  //           {user?.verificationStatus === "verified"  && (
  //             <View style={styles.locationRow}>
  //               <Ionicons name="location" size={12} color={Colors.textSecondary} />
  //               <Text style={styles.propertyLocation}>
  //                 {property.phase}, {property.block}
  //               </Text>
  //             </View>
  //           )}
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
  //         <View>
  //           {/* Added By */}
  //           <View style={styles.addedByContainer}>
  //             <AvatarInitials name={property.userId?.name || 'Unknown'} size={32} backgroundColor={Colors.neutral30} textColor={Colors.text} />
  //             <View style={styles.addedByDetailsContainer}>
  //               <Text style={styles.addedByLabel}>Added by</Text>
  //               <Text style={styles.addedBy}>{property.userId?.name || 'Unknown'}</Text>
  //             </View>
  //           </View>
  //         </View>
  //         <View style={[property.listingType === "cash" ? styles.statusBadgeCash: styles.statusBadgeInstallments]}>
  //           <Text style={[property.listingType === "cash" ? styles.statusTextCash : styles.statusTextInstallments]}>{property.listingType === "cash" ? "Cash" : "Installments"}</Text>
  //         </View>
  //       </View>

  //       {/* Action Buttons */}
  //       {user?.verificationStatus === "verified"  && (
  //         <View style={styles.actionButtons}>
  //           <TouchableOpacity style={styles.detailsButton} onPress={() => handlePropertyDetails(property._id)}>
  //             <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
  //             <Text style={styles.actionButtonText}>Details</Text>
  //           </TouchableOpacity>
  //           <TouchableOpacity style={styles.contactButton}>
  //             <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
  //             <Text style={styles.actionButtonText}>Contact</Text>
  //           </TouchableOpacity>
  //         </View>
  //       )}
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

  const ListHeader = (
    <>
      {(user?.verificationStatus === "pending") && (
        <View style={styles.accountVerificationContainer}>
          <Text style={styles.accountVerificationText}>Your account will be verified under 24 hours. You will then be able to add, view and update listings.</Text>
        </View>
      )}

      {(user?.verificationStatus === "rejected") && (
        <View style={styles.accountVerificationContainer}>
          <Text style={styles.accountVerificationText}>Your account has been rejected. Please contact support.</Text>
        </View>
      )}
      <View style={styles.header}>
      {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.userGreeting}>
            <MaterialCommunityIcons name="account-circle" size={32} color={Colors.text} onPress={() => router.push("/profile")}/>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0]}</Text>
              <Text style={styles.role}>{user?.estateName}</Text>
            </View>
          </View>

          {/* Property Type Dropdown */}
          <View style={styles.propertyTypeDropdownWrapper}>
            <TouchableOpacity
              style={styles.propertyTypeDropdownButton}
              activeOpacity={0.85}
              onPress={() => setShowPropertyTypeDropdown(true)}
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
            />
          <TouchableOpacity style={styles.filterIconButton} onPress={handleOpenFilterModal}>
            <MaterialCommunityIcons name="tune" size={18} color={Colors.text} />
          </TouchableOpacity>
          </View>
        </View>
      </View>
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
      />
      
    </>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        {loading && listings.length === 0 ? (
          <View style={styles.initialLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.initialLoadingText}>Loading listings...</Text>
          </View>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item, index) => item._id || `listing-${index}`}
            renderItem={({ item }) => <PropertyCard property={item} user={user || {} as User} handlePropertyDetails={handlePropertyDetails} />}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : !hasMore && listings.length > 0 ? (
                <View style={styles.endOfListContainer}>
                  <Text style={styles.endOfListText}>No more listings to load</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
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
        )}
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={showPropertyTypeDropdown}
        animationType="fade"
        onRequestClose={() => setShowPropertyTypeDropdown(false)}
      >
        <View style={styles.dropdownModalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.dropdownBackdrop}
            onPress={() => setShowPropertyTypeDropdown(false)}
          />
          <View style={styles.dropdownContent}>
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
        </View>
      </Modal>

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
    backgroundColor: Colors.headerBackground,
  },
  keyboardView: {
    flex: 1,
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
    gap: 6,
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
  dropdownModalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 120,
    paddingHorizontal: 16,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  dropdownContent: {
    zIndex: 1,
    alignSelf: "flex-start",
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
