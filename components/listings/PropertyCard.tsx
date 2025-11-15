import { Colors } from "@/constants/colors";
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles";
import { User } from "@/types/auth";
import { ListingState } from "@/types/listings";
import { showErrorToast, showInfoToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AvatarInitials } from "../AvatarInitials";
import { DetailsIcon, LocationIcon } from "./Icons";

/**
 * Sanitizes a phone number by removing all non-digit characters except '+'
 * @param phoneNumber - The phone number to sanitize
 * @returns Sanitized phone number
 */
const sanitizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  // Remove all characters except digits and '+'
  return phoneNumber.replace(/[^\d+]/g, "");
};

/**
 * Handles the contact button press to initiate a phone call
 * @param contactNumber - The contact number from the listing
 */
const handleContactPress = async (contactNumber: string | undefined) => {
  try {
    // Validate contact number exists
    if (!contactNumber || !contactNumber.trim()) {
      showInfoToast("Contact number is not available for this listing.", "Contact Unavailable");
      return;
    }

    // Sanitize the phone number
    const sanitizedNumber = sanitizePhoneNumber(contactNumber.trim());
    
    // Validate sanitized number is not empty
    if (!sanitizedNumber || sanitizedNumber.length === 0) {
      showErrorToast("The contact number format is invalid. Please try again later.", "Invalid Contact Number");
      return;
    }

    // Provide haptic feedback for better UX
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (hapticError) {
      // Silently fail if haptics are not available
      // This ensures the phone dialer still opens even if haptics fail
    }

    // Create the tel: URL
    const phoneUrl = `tel:${sanitizedNumber}`;

    // Check if the device can handle phone calls
    const canOpen = await Linking.canOpenURL(phoneUrl);
    
    if (!canOpen) {
      showInfoToast("Your device cannot make phone calls. Please check your device settings.", "Unable to Make Call");
      return;
    }

    // Open the phone dialer with the number pre-filled
    await Linking.openURL(phoneUrl);
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error opening phone dialer:", error);
    showErrorToast("Unable to open phone dialer. Please try again later.");
  }
};

export const PropertyCard = ({ property, user, handlePropertyDetails }: { property: ListingState, user: User, handlePropertyDetails: (listingId: string) => void }) => (
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
            <Text style={styles.price}>Rs. {property.rentPerMonth}/month</Text>
          ) : (
            <Text style={styles.price}>Rs. {property.price || property.totalPrice}</Text>
          )}
        </View>

        {user?.verificationStatus === "verified"  && (
              <View style={styles.locationRow}>
                <LocationIcon color={Colors.neutral80} size={14} />
                <Text style={styles.propertyLocation}>
                  {property.phase}, {property.block}
                </Text>
              </View>
            )}
        </View>

        {/* Meta Information */}
        <View style={styles.propertyMetaRow}>
          <View>
            {/* Added By */}
            <View style={styles.addedByContainer}>
              <AvatarInitials name={property.userId?.name || 'Unknown'} size={32} backgroundColor={Colors.neutral30} textColor={Colors.text} />
              <View style={styles.addedByDetailsContainer}>
                <Text style={styles.addedByLabel}>Added by</Text>
                <Text style={styles.addedBy}>{property.userId?.name?.split(" ")[0] || 'Unknown'} {property.userId?.name?.split(" ")[1] ? property.userId?.name?.split(" ")[1][0] + "." : ""}</Text>
              </View>
            </View>
          </View>
          <View style={[property.listingType === "cash" ? styles.statusBadgeCash: styles.statusBadgeInstallments]}>
            <Text style={[property.listingType === "cash" ? styles.statusTextCash : styles.statusTextInstallments]}>{property.listingType === "cash" ? "Cash" : "Installments"}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {user?.verificationStatus === "verified"  && (
          <View style={styles.actionButtons}>
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
    </View>
  )

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