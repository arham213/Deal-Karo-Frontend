import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
import { showErrorToast, showInfoToast } from "./toast";

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
  export const handleContactPress = async (contactNumber: string | undefined) => {
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