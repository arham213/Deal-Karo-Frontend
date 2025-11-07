"use client"

import FilterModal from "@/components/listings/FilterModal"
import { ListingDetailsModal } from "@/components/listings/ListingsDetailsModal"
import { Colors } from "@/constants/colors"
import type { ListingState } from "@/types/listings"
import { getToken } from "@/utils/secureStore"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import axios from "axios"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function MyListingsScreen() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingState[]>([])
  const [activePropertyTab, setActivePropertyTab] = useState<"Plots" | "Houses">("Plots")
  const [activeFilter, setActiveFilter] = useState("All Listings")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [clickedListing, setClickedListing] = useState<ListingState>()
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('getting listings');
    getListings()
  },[])

  const BASE_URL = "http://10.224.131.91:8080/api"

  const getListings = async () => {
    const token = await getToken()

    if (!token) throw new Error("Token missing. Please log in again.")

    setLoading(true)
    try {
      const response = await axios.get(`${BASE_URL}/properties/my-properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("response:", response?.data)

      setLoading(false)
      if (response?.data.success) {
        console.log("properties:", response.data.data.properties)
        setListings(response.data.data.properties)
      } else {
        alert("Failed to fetch my listings")
      }
    } catch (error) {
      setLoading(false)

      if (axios.isAxiosError(error)) {
        alert(error?.response?.data?.error?.message)
      } else {
        alert("Something went wrong. Please try again later")
      }
    }
  }

  const handlePropertyDetails = (listingId: string) => {
    const clickedListing = listings.filter((listing) => listing._id === listingId)
    setClickedListing(clickedListing[0])
    setShowDetailsModal(true)
  }

  const PropertyCard = ({ property }: { property: ListingState }) => (
    <View style={styles.propertyCard}>
      {/* Content */}
      <View style={styles.propertyContent}>
        {/* Header with Title and Status */}
        <View style={styles.propertyHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.propertyTitle}>
              {property.area} {property.propertyType}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={Colors.textSecondary} />
              <Text style={styles.propertyLocation}>
                {property.block} {property.phase}
              </Text>
            </View>
          </View>
          {/* {property.} */}
          {property.listingType === "rent" ? (
            <Text style={styles.price}>Rs. {property.rentPerMonth}/month</Text>
          ) : (
            <Text style={styles.price}>Rs. {property.price || property.totalPrice}</Text>
          )}
        </View>

        {/* Meta Information */}
        <View style={styles.propertyMetaRow}>
          <View style={[styles.statusBadge, { backgroundColor: Colors.primary }]}>
            <Text style={styles.statusText}>{property.listingType}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.detailsButton} onPress={() => handlePropertyDetails(property._id)}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const ListHeader = () => (
    <>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.userGreeting}>
          <MaterialCommunityIcons name="account-circle" size={32} color={Colors.text} />
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>My Listings</Text>
            <Text style={styles.role}>Capital Estate</Text>
          </View>
        </View>

        {/* Property Type Tabs */}
        <View style={styles.propertyTypeTabs}>
          {["Plots", "Houses"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeTab, activePropertyTab === type && styles.activeTypeTab]}
              onPress={() => setActivePropertyTab(type as "Plots" | "Houses")}
            >
              <Text style={[styles.typeTabText, activePropertyTab === type && styles.activeTypeTabText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={Colors.placeholder} />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity style={styles.filterIconButton} onPress={() => setShowFilterModal(true)}>
          <MaterialCommunityIcons name="tune" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        scrollEnabled
        data={["All Listings", "For cash", "Instalments", "For rent"]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterCategoryScroll}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterCategoryTab, activeFilter === item && styles.activeFilterCategoryTab]}
            onPress={() => setActiveFilter(item)}
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
        <FlatList
          data={listings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.container}
          scrollEnabled
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(appliedFilters: any) => {
          setFilters(appliedFilters)
          setShowFilterModal(false)
        }}
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    paddingBottom: 70,
  },
  headerSection: {
    // flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  greetingText: {
    justifyContent: "center",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  role: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  propertyTypeTabs: {
    flexDirection: "row",
    gap: 12,
  },
  typeTab: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 33
  },
  activeTypeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeTypeTabText: {
    color: Colors.white,
  },
  searchFilterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.placeholder,
  },
  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  filterCategoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterCategoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterCategoryTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterCategoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  activeFilterCategoryText: {
    color: Colors.white,
  },
  propertyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginHorizontal: 16,
    marginVertical: 6,
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
    padding: 12,
    gap: 8,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    flex: 1,
    gap: 4,
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  propertyLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
  },
  propertyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  addedBy: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 8,
    gap: 12,
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
    gap: 6,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
})