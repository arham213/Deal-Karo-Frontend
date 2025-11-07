import { Colors } from "@/constants/colors"
import { ListingState } from "@/types/listings"
import { Ionicons } from "@expo/vector-icons"
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../Button"

interface ListingDetailsProps {
  visible: boolean
  onClose: () => void
  listing: ListingState | undefined
}

export function ListingDetailsModal({ visible, onClose, listing }: ListingDetailsProps) {
  const getTypeBadgeColor = (type: string | undefined) => {
    switch (type) {
      case "For Cash":
        return Colors.success
      case "For Rent":
        return "#8B7FD1"
      case "Installment":
        return "#FFA500"
      default:
        return Colors.textSecondary
    }
  }

  // Parse moreOptions to get features
  const getFeatures = () => {
    const features: string[] = []
    if (!listing?.moreOptions) return features

    try {
      const moreOptions = JSON.parse(listing.moreOptions)
      if (moreOptions.hasPole) {
        features.push("Don't have a pole")
      }
      if (moreOptions.hasWire) {
        features.push("No wire")
      }
    } catch (error) {
      console.error("Error parsing moreOptions:", error)
    }
    return features
  }

  const features = getFeatures()

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Title</Text>
              <Text style={styles.value}>{listing?.area} {listing?.propertyType}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Type</Text>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: getTypeBadgeColor(listing?.listingType),
                  },
                ]}
              >
                <Text style={styles.typeBadgeText}>{listing?.listingType}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{listing?.description || '---'}</Text>
            </View>

            {listing?.propertyType === "plot" || listing?.propertyType === "commercial plot" ? (
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Plot No</Text>
                    <Text style={styles.value}>{listing?.plotNo}</Text>
                </View>
            ): (
                <View style={styles.detailRow}>
                    <Text style={styles.label}>House No</Text>
                    <Text style={styles.value}>{listing?.houseNo}</Text>
                </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.label}>Additional Area</Text>
              <Text style={styles.value}>{listing?.additionalArea || '---'}</Text>
            </View>

            {listing?.propertyType === "plot" || listing?.propertyType === "commercial plot" && listing.listingType === "cash" && (
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Price Per Marla</Text>
                    <Text style={styles.value}>{listing?.pricePerMarla}</Text>
                </View>
            )}

            {listing?.listingType === "rent" ? (
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Price</Text>
                    <Text style={styles.value}>{listing?.rentPerMonth}</Text>
                </View>
            ) : (
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Price</Text>
                    <Text style={styles.value}>{listing?.price || listing?.totalPrice}</Text>
                </View>
            )}

            {listing?.listingType === "installments" && (
                <>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Installment Per Month</Text>
                        <Text style={styles.value}>{listing?.installment?.perMonth}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Installment Quarterly</Text>
                        <Text style={styles.value}>{listing?.installment?.quarterly}</Text>
                    </View>
                </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{listing?.phase || '---'}, {listing?.block || '---'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Added by</Text>
              <Text style={styles.value}>{listing?.userId?.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Estate</Text>
              <Text style={styles.value}>{listing?.userId?.estateName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Listing ID</Text>
              <Text style={styles.value}>{listing?._id}</Text>
            </View>

            {features.length > 0 && (
              <View style={styles.featuresSection}>
                <Text style={styles.featuresLabel}>Features</Text>
                <View style={styles.featuresList}>
                  {features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.buttonGroup}>
            <Button
              title="Contact"
              onPress={onClose}
              style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}
            />
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  detailsContainer: {
    gap: 20,
    paddingVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },
  featuresSection: {
    gap: 12,
  },
  featuresLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
  },
  buttonGroup: {
    gap: 12,
    paddingVertical: 24,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
})