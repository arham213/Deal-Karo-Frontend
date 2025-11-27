import { Colors } from "@/constants/colors";
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles";
import { User } from "@/types/auth";
import { ListingState } from "@/types/listings";
import { handleContactPress } from "@/utils/dialContact";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AvatarInitials } from "../AvatarInitials";
import { DetailsIcon, LocationIcon } from "./Icons";

// function formatPrice(num: number | undefined): string {
//   if (!num) return 's';

//   if (num >= 1_00_00_000) {
//     return (num / 1_00_00_000).toFixed(2).replace(/\.00$/, "") + " Crore";
//   }
//   if (num >= 1_00_000) {
//     return (num / 1_00_000).toFixed(2).replace(/\.00$/, "") + " Lac";
//   }
//   if (num >= 1_000) {
//     return (num / 1_000).toFixed(2).replace(/\.00$/, "") + " K";
//   }
//   return num.toString();
// }


export const PropertyCard = ({ property, user, handlePropertyDetails, onDelete, showDelete }: { property: ListingState, user: User, handlePropertyDetails: (listingId: string) => void, onDelete?: (propertyId: string) => void, showDelete?: boolean }) => {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const menuButtonRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleMenuPress = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get("window").width;
      const menuWidth = 100;
      // Position menu to the left of the button, but ensure it doesn't go off screen
      let posX = x - menuWidth + width;
      if (posX < 10) posX = 10;
      if (posX + menuWidth > screenWidth - 10) posX = screenWidth - menuWidth - 10;
      
      setMenuPosition({ x: posX + width + 20, y: y - height - 20 });
      setShowDeleteMenu(true);
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(property._id);
      setShowDeleteMenu(false);
    }
  };

  return (
  <View style={styles.propertyCard}>
    {/* Content */}
    <View style={styles.propertyContent}>
      {/* Header with Title and Status */}
      <View style={styles.headerWithLocation}>
        <View style={styles.propertyHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.propertyTitle}>
              {property.area}
            </Text>
          </View>
          {/* {property.} */}
          {property.listingType === "rent" ? (
            <>
              <Text style={styles.price}>Rs. {property.rentPerMonth}</Text>
              <Text style={styles.pricePerMarlaUnit}>/month</Text>
            </>
          ) : (property.propertyType === "plot" || property.propertyType === "commercial plot") && property.listingType === "cash" ? (
            <View style={styles.pricePerMarlaContainer}>
              <Text style={styles.price}>Rs. {property.pricePerMarla}</Text>
              <Text style={styles.pricePerMarlaUnit}>/Marla</Text>
            </View>
          ) : (
            <Text style={styles.price}>Rs. {property.price}</Text>
          )}
        </View>

        {user?.verificationStatus === "verified" && (
          <View style={styles.locationRow}>
            <LocationIcon color={Colors.neutral80} size={14} />
            <Text style={styles.propertyLocation}>
              {property.plotNo || property.houseNo || ""}, {property.phase || ""}, {property.block || ""}
            </Text>
          </View>
        )}
      </View>

      {/* Meta Information */}
      <View style={styles.propertyMetaRow}>
        <View style={styles.addedByWrapper}>
          {/* Added By */}
          <View style={styles.addedByContainer}>
            <AvatarInitials name={property.userId?.name || 'Unknown'} size={32} backgroundColor={Colors.neutral30} textColor={Colors.text} />
            <View style={styles.addedByDetailsContainer}>
              <Text style={styles.addedByLabel}>Added by</Text>
              <Text style={styles.addedBy}>{property.userId?.name?.split(" ")[0] || 'Unknown'} {property.userId?.name?.split(" ")[1] ? property.userId?.name?.split(" ")[1][0] + "." : ""}</Text>
            </View>
          </View>
        </View>
        <View style={[property.listingType === "cash" ? styles.statusBadgeCash : styles.statusBadgeInstallments]}>
          <Text style={[property.listingType === "cash" ? styles.statusTextCash : styles.statusTextInstallments]}>{property.listingType === "cash" ? "Cash" : "Installments"}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {user?.verificationStatus === "verified" && (
        <View style={styles.actionButtons}>
          {/* Delete Menu Button - Only show on my-listings */}
          {showDelete && (
            <View ref={menuButtonRef} style={styles.menuButtonContainer}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleMenuPress}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.detailsButton} onPress={() => handlePropertyDetails(property._id)}>
            <DetailsIcon color={Colors.textSecondary} size={16} />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactPress(property.forContact)}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.actionButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* Delete Menu Modal */}
    {showDelete && (
      <Modal
        transparent
        visible={showDeleteMenu}
        animationType="fade"
        onRequestClose={() => setShowDeleteMenu(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.deleteMenuBackdrop}
          onPress={() => setShowDeleteMenu(false)}
        >
          <View style={[styles.deleteMenuContent, { left: menuPosition.x, top: menuPosition.y }]}>
            <TouchableOpacity
              style={styles.deleteMenuItem}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={styles.deleteMenuText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    )}
  </View>
  )
}

const styles = StyleSheet.create({
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
  headerWithLocation: {
    flex: 1,
    gap: spacing.sm
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
  addedByWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  menuButtonContainer: {
    // marginLeft: spacing.xs,
  },
  menuButton: {
    paddingVertical: 4,
  },
  deleteMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  deleteMenuContent: {
    position: "absolute",
    minWidth: 100,
    borderRadius: radius.md,
    backgroundColor: Colors.neutral10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.neutral40,
  },
  deleteMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteMenuText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral90,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
  },
  addedByLabel: {
    fontSize: fontSizes.xs,
    color: Colors.neutral80,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    fontWeight: fontWeights.medium,
    letterSpacing: 0.12,
  },
  pricePerMarlaContainer: {
    flexDirection: "row",
    gap: spacing.xxxs,
  },
  price: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
  },
  pricePerMarlaUnit: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral80,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.12,
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
    alignItems: "center",
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