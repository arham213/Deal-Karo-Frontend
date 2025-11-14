"use client"

import { Colors } from "@/constants/colors"
import { radius } from "@/styles"
import { User } from "@/types/auth"
import { getToken } from "@/utils/secureStore"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import axios from "axios"
import { usePathname, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { DisabledMyListingsIcon, DisabledNotesIcon, MyListingsIcon, NotesIcon } from "./Icons"

const BASE_URL = "http://10.190.83.91:8080/api"

export function BottomNavigationBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  // Refresh user data on mount and when pathname changes (navigation)
  // This ensures verification status is updated without app relaunch
  useEffect(() => {
    getUserFromSecureStore()
  }, [pathname])

  // Also refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        getUserFromSecureStore()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const getUserFromSecureStore = async () => {
    try {
      const token = await getToken()
      if (!token) {
        console.error("Token missing")
        return
      }

      const response = await axios.get(`${BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log('User response:', response.data);
      if (response.data.success) {
        setUser(response.data.data.user)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const isVerified = user?.verificationStatus === "verified"

  const handleNavigation = (route: string) => {
    // Protected routes that require verification
    const protectedRoutes = ["/my-notes", "/my-listings"]
    
    if (protectedRoutes.includes(route) && !isVerified) {
      Alert.alert(
        "Access Restricted",
        "Your account needs to be verified by an admin to access this feature. Please wait for verification or contact support.",
        [{ text: "OK" }]
      )
      return
    }
    
    router.push(route as any)
  }

  const handleAddListing = () => {
    if (!isVerified) {
      Alert.alert(
        "Access Restricted",
        "Your account needs to be verified by an admin to add listings. Please wait for verification or contact support.",
        [{ text: "OK" }]
      )
      return
    }
    router.push("/add-listing")
  }

  const isActive = (route: string) => {
    if (route === "/listings") {
      return pathname === "/listings" || pathname.startsWith("/listings")
    }
    return pathname === route || pathname.startsWith(`${route}/`)
  }

  const HomeIcon = ({ color, size }: { color: string, size: number }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20.83 8.01002L14.28 2.77002C13 1.75002 11 1.74002 9.72999 2.76002L3.17999 8.01002C2.23999 8.76002 1.66999 10.26 1.86999 11.44L3.12999 18.98C3.41999 20.67 4.98999 22 6.69999 22H17.3C18.99 22 20.59 20.64 20.88 18.97L22.14 11.43C22.32 10.26 21.75 8.76002 20.83 8.01002ZM12.75 18C12.75 18.41 12.41 18.75 12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18Z" fill= {color}/>
      </Svg>
    )
  }

  const DisabledHomeIcon = ({ color, size }: { color: string, size: number }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 18V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10.0698 2.81997L3.13978 8.36997C2.35978 8.98997 1.85978 10.3 2.02978 11.28L3.35978 19.24C3.59978 20.66 4.95978 21.81 6.39978 21.81H17.5998C19.0298 21.81 20.3998 20.65 20.6398 19.24L21.9698 11.28C22.1298 10.3 21.6298 8.98997 20.8598 8.36997L13.9298 2.82997C12.8598 1.96997 11.1298 1.96997 10.0698 2.81997Z" stroke="#C2C2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </Svg>
    )
  }

  return (
    <SafeAreaView style={styles.bottomNavigationBar} edges={["bottom"]}>
      <View style={styles.navBarContent}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("/listings")}
        >
          {isActive("/listings") ? <HomeIcon color={Colors.primary} size={24} /> : <DisabledHomeIcon color={Colors.neutral50} size={24} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, user !== null && !isVerified && styles.disabledNavButton]} 
          onPress={() => handleNavigation("/my-notes")}
          disabled={user !== null && !isVerified} // Only disable if user is loaded and not verified
        >
          {isActive("/my-notes") ? <NotesIcon color={Colors.primary} size={24} /> : <DisabledNotesIcon color={user !== null && !isVerified ? Colors.neutral30 : Colors.neutral50} size={24} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.fabButton, user !== null && !isVerified && styles.disabledFabButton]} 
          onPress={handleAddListing}
        >
          <Text style={[styles.fabIcon, user !== null && !isVerified && styles.disabledFabIcon]}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, user !== null && !isVerified && styles.disabledNavButton]}
          onPress={() => handleNavigation("/my-listings")}
          disabled={user !== null && !isVerified}
        >
          {isActive("/my-listings") ? <MyListingsIcon color={Colors.primary} size={24} /> : <DisabledMyListingsIcon color={user !== null && !isVerified ? Colors.neutral30 : Colors.neutral50} size={24} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("/profile")}
        >
          {isActive("/profile") ? <MaterialCommunityIcons name="account-circle" size={24} color={Colors.primary}/> : <MaterialCommunityIcons name="account-circle" size={24} color={Colors.neutral50}/>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  bottomNavigationBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBarContent: {
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "relative",
  },
  bottomBorder: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    right: 0,
    borderBottomWidth: 4,
    borderStyle: "solid",
    borderBottomColor: Colors.neutral100,
    maxWidth: 134,
    alignSelf: "center",
    borderRadius: radius.pill,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    boxShadow: "0 6px 14px 0 rgba(0, 0, 0, 0.38)"
  },
  disabledFabButton: {
    backgroundColor: Colors.neutral30,
    opacity: 0.6,
  },
  fabIcon: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: "300",
  },
  disabledFabIcon: {
    color: Colors.neutral60,
  },
})

