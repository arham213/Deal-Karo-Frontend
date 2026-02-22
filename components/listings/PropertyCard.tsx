import { Colors } from "@/constants/colors";
import { createChat } from "@/services/chatService";
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles";
import { User } from "@/types/auth";
import { ListingState } from "@/types/listings";
import { handleContactPress } from "@/utils/dialContact";
import { formatRelativeTimeLibrary } from "@/utils/formatDateNow";
import formatPrice from "@/utils/formatPrice";
import { showErrorToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AvatarInitials } from "../AvatarInitials";
import { DetailsIcon, LocationIcon } from "./Icons";


export const PropertyCard = ({ property, user, handlePropertyDetails, onDelete, onEdit, showDelete }: { property: ListingState, user: User, handlePropertyDetails: (listingId: string) => void, onDelete?: (propertyId: string) => void, onEdit?: (property: ListingState) => void, showDelete?: boolean }) => {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const menuButtonRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

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

  const handleEdit = () => {
    if (onEdit) {
      onEdit(property);
      setShowDeleteMenu(false);
    }
  };

  const handleChatPress = async () => {
    if (!property.userId?._id) return;

    // Prevent chatting with self
    if (user && property.userId._id === user._id) {
      showErrorToast("You cannot chat with yourself", "Action Not Allowed");
      return;
    }

    try {
      setIsChatLoading(true);
      const response = await createChat(property.userId._id);

      if (response && response.data?.chat) {
        router.push({
          pathname: "/(chat)/chat",
          params: {
            chatId: response.data.chat._id,
            participantName: property.userId.name,
            participantId: property.userId._id
          }
        });
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      showErrorToast("Failed to start chat. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <View style={styles.propertyCard}>

      {/* Content */}
      <TouchableOpacity
        style={styles.propertyContent}
        onPress={() => {
          if (user?.verificationStatus === "verified") {
            handlePropertyDetails(property._id)
          }
        }}
        activeOpacity={0.7}
      >
        {/* Image with overlaid badges */}
        <View style={styles.propertyImageContainer}>
          {user?.verificationStatus === "verified" && property.imageUrl ? (
            <>
              <Image
                source={{ uri: property.imageUrl }}
                style={styles.propertyImage}
                contentFit="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={Colors.neutral60} />
              <Text style={styles.imagePlaceholderText}>{user?.verificationStatus !== "verified" ? "Verify to View" : "No Image"}</Text>
            </View>
          )}
          {/* Status Badge (Cash/Installments) - Top Left */}
          <View style={[property.listingType === "cash" ? styles.statusBadgeCashOverlay : styles.statusBadgeInstallmentsOverlay]}>
            <Text style={[property.listingType === "cash" ? styles.statusTextCash : styles.statusTextInstallments]}>
              {property.listingType.charAt(0).toUpperCase() + property.listingType.slice(1)}
            </Text>
          </View>
          {/* Possession Badge - Top Right */}
          {user?.verificationStatus === "verified" && (
            property.possession === true ? (
              <View style={styles.possessionBadgeOverlay}>
                <Text style={styles.possessionBadgeText}>Possession</Text>
              </View>
            ) : (
              <View style={styles.nonPossessionBadgeOverlay}>
                <Text style={styles.nonPossessionBadgeText}>Non-Possession</Text>
              </View>
            )
          )}
        </View>
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
                <Text style={styles.price}>Rs. {formatPrice(Number(property.rentPerMonth))}</Text>
                <Text style={styles.pricePerMarlaUnit}>/month</Text>
              </>
            ) : (property.propertyType === "plot" || property.propertyType === "commercial plot") && property.listingType === "cash" ? (
              <View style={styles.pricePerMarlaContainer}>
                <Text style={styles.price}>Rs. {formatPrice(Number(property.pricePerMarla))}</Text>
                <Text style={styles.pricePerMarlaUnit}>/Marla</Text>
              </View>
            ) : (
              <Text style={styles.price}>Rs. {formatPrice(Number(property.price))}</Text>
            )}
          </View>

          {/* Location Row */}
          <View style={styles.locationRowContainer}>
            {user?.verificationStatus === "verified" && (
              <View style={styles.locationRow}>
                <LocationIcon color={Colors.neutral80} size={14} />
                <Text style={styles.propertyLocation}>
                  {property.plotNo || property.houseNo || ""}, {property.phase || ""}, {property.block || ""}
                </Text>
              </View>
            )}
            <View style={styles.locationRowTextContainer}>
              <Ionicons name="time-outline" size={14} color={Colors.neutral80} />
              <Text style={styles.locationRowText}>{formatRelativeTimeLibrary(property.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Meta Information */}
        {user?.verificationStatus === "verified" && (
          <View style={styles.propertyMetaRow}>
            <View style={styles.addedByWrapper}>
              {/* Added By */}
              {user?.verificationStatus === "verified" && (
                <View style={styles.addedByContainer}>
                  <AvatarInitials name={property.userId?.name || 'Unknown'} size={32} backgroundColor={Colors.neutral30} textColor={Colors.text} />
                  <View style={styles.addedByDetailsContainer}>
                    <Text style={styles.addedBy}>{property.userId?.name?.split(" ")[0] || 'Unknown'} {property.userId?.name?.split(" ")[1] ? property.userId?.name?.split(" ")[1][0] + "." : ""}</Text>
                    <Text style={styles.addedByLabel}>{property?.userId?.estateName && property?.userId?.estateName?.length > 17 ? property?.userId?.estateName?.slice(0, 20) + "..." : property?.userId?.estateName}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

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

            {!showDelete && (
              <TouchableOpacity
                style={styles.chatButton}
                onPress={handleChatPress}
                disabled={isChatLoading}
                activeOpacity={0.7}
              >
                {isChatLoading ? (
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                ) : (
                  <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
                )}
                <Text style={styles.actionButtonText}>Chat</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactPress(property.forContact)}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={16} color={Colors.white} />
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {/* Delete Menu Modal */}
      {
        showDelete && (
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
                  onPress={handleEdit}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                  <Text style={[styles.deleteMenuText, { color: Colors.primary }]}>Edit</Text>
                </TouchableOpacity>
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
        )
      }
    </View >
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
    height: 200,
    backgroundColor: Colors.inputBackground,
    position: "relative",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral20,
    gap: spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral60,
    fontFamily: fontFamilies.primary,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.neutral20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  possessionBadgeOverlay: {
    position: "absolute",
    top: spacing.md2,
    right: spacing.md2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: Colors.backgroundPossession,
  },
  nonPossessionBadgeOverlay: {
    position: "absolute",
    top: spacing.md2,
    right: spacing.md2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: Colors.backgroundNonPossession,
  },
  statusBadgeCashOverlay: {
    position: "absolute",
    top: spacing.md2,
    left: spacing.md2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: Colors.backgroundCash,
  },
  statusBadgeInstallmentsOverlay: {
    position: "absolute",
    top: spacing.md2,
    left: spacing.md2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: Colors.backgroundInstallments,
  },
  propertyContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerWithLocation: {
    flex: 1,
    gap: spacing.sm
  },
  possessionBadge: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    // borderRadius: radius.lg,
    backgroundColor: Colors.backgroundPossession,
  },
  possessionBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: Colors.textPossession,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.12,
  },
  nonPossessionBadge: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    // borderRadius: radius.lg,
    backgroundColor: Colors.backgroundNonPossession,
  },
  nonPossessionBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: Colors.textNonPossession,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.12,
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
  locationRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: -spacing.xxs,
  },
  locationRowTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  locationRowText: {
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

  chatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xs,
    backgroundColor: Colors.neutral20,
    borderRadius: radius.lg,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: radius.lg,
  },
  contactButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.white,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.14,
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