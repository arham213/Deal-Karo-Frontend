"use client"

import FilterModal from "@/components/FilterModal"
import { Colors } from "@/constants/colors"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"

interface Property {
  id: string
  title: string
  location: string
  area: string
  price: string
  status: "For Sale" | "For Rent" | "Installment"
  statusColor: string
  addedBy: string
  image?: string
}

const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    title: "5 Marla Plot",
    location: "Block D, Phase 2",
    area: "MS",
    price: "Rs. 25 Lacs",
    status: "For Sale",
    statusColor: Colors.success,
    addedBy: "Muhseel S.",
    image: "https://via.placeholder.com/300x200?text=Property+1",
  },
  {
    id: "2",
    title: "5 Marla Plot",
    location: "Block D, Phase 2",
    area: "MS",
    price: "Rs. 35 Lacs",
    status: "Installment",
    statusColor: "#FF9500",
    addedBy: "Muhseel S.",
    image: "https://via.placeholder.com/300x200?text=Property+2",
  },
  {
    id: "3",
    title: "5 Marla Plot",
    location: "Block D, Phase 2",
    area: "MS",
    price: "Rs. 25 Lacs",
    status: "For Sale",
    statusColor: Colors.success,
    addedBy: "Fahad C.",
    image: "https://via.placeholder.com/300x200?text=Property+3",
  },
  {
    id: "4",
    title: "10 Marla",
    location: "Block D1, Phase 2",
    area: "MS",
    price: "Rs. 3.5 Crore",
    status: "Installment",
    statusColor: "#FF9500",
    addedBy: "Muhseel S.",
    image: "https://via.placeholder.com/300x200?text=Property+4",
  },
  {
    id: "5",
    title: "10 Marla",
    location: "Block D1, Phase 2",
    area: "MS",
    price: "Rs. 100k/month",
    status: "For Rent",
    statusColor: "#5B7FFF",
    addedBy: "Fahad C.",
    image: "https://via.placeholder.com/300x200?text=Property+5",
  },
  {
    id: "6",
    title: "3 Marla",
    location: "Block H, Phase 2",
    area: "MS",
    price: "Rs. 55 Lacs",
    status: "For Sale",
    statusColor: Colors.success,
    addedBy: "Sajid S.",
    image: "https://via.placeholder.com/300x200?text=Property+6",
  },
]

export default function ListingsScreen() {
  const router = useRouter()
  const [activePropertyTab, setActivePropertyTab] = useState<"Plots" | "Houses">("Plots")
  const [activeFilter, setActiveFilter] = useState("All Listings")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState({})

  const handleAddListing = () => {
    router.push("/add-listing")
  }

  const handlePropertyDetails = (propertyId: string) => {
    // router.push(`/property/${propertyId}`)
  }

  const PropertyCard = ({ property }: { property: Property }) => (
    <View style={styles.propertyCard}>
      {/* Image Container */}
      <View style={styles.propertyImageContainer}>
        <Image source={{ uri: property.image }} style={styles.propertyImage} />
      </View>

      {/* Content */}
      <View style={styles.propertyContent}>
        {/* Header with Title and Status */}
        <View style={styles.propertyHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={Colors.textSecondary} />
              <Text style={styles.propertyLocation}>{property.location}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: property.statusColor }]}>
            <Text style={styles.statusText}>{property.status}</Text>
          </View>
        </View>

        {/* Meta Information */}
        <View style={styles.propertyMetaRow}>
          <Text style={styles.metaLabel}>{property.area}</Text>
          <Text style={styles.price}>{property.price}</Text>
        </View>

        {/* Added By */}
        <Text style={styles.addedBy}>Added by {property.addedBy}</Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.detailsButton} onPress={() => handlePropertyDetails(property.id)}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.actionButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.userGreeting}>
              <MaterialCommunityIcons name="account-circle" size={32} color={Colors.text} />
              <View style={styles.greetingText}>
                <Text style={styles.greeting}>Hi, Fahad</Text>
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
                  <Text style={[styles.typeTabText, activePropertyTab === type && styles.activeTypeTabText]}>
                    {type}
                  </Text>
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

          {/* Filter Category Tabs */}
          <FlatList
            horizontal
            data={["All Listings", "For sale", "Instalments", "For rent"]}
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

          {/* Properties List */}
          <FlatList
            data={MOCK_PROPERTIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PropertyCard property={item} />}
            scrollEnabled={false}
            contentContainerStyle={styles.propertiesList}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavigationBar}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="home-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="list-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabButton} onPress={handleAddListing}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="heart-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="person-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(appliedFilters: any) => {
          setFilters(appliedFilters)
          setShowFilterModal(false)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 70,
  },
  headerSection: {
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
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
  propertiesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  propertyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
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
  bottomNavigationBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -8,
  },
  fabIcon: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: "300",
  },
})