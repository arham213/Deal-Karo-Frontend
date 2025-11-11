"use client"

import { Colors } from "@/constants/colors"
import { radius } from "@/styles"
import { User } from "@/types/auth"
import { getToken } from "@/utils/secureStore"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import axios from "axios"
import { usePathname, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { DisabledMyListingsIcon, DisabledNotesIcon, MyListingsIcon, NotesIcon } from "./Icons"

export function BottomNavigationBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    getUserFromSecureStore()
  }, [])

  const getUserFromSecureStore = async () => {
    // const user = await getUser()
    // if (user) {
    //   setUser(user)
    // }

    // setLoading(true)
    try {
      const token = await getToken()
      if (!token) {
        console.error("Token missing")
        throw new Error("Token missing")
      }

      const response = await axios.get(`http://10.190.83.91:8080/api/users/me`, {
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
      // setLoading(false)
    }
  }
  const handleNavigation = (route: string) => {
    router.push(route as any)
  }

  const handleAddListing = () => {
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
          style={styles.navButton} 
          onPress={() => handleNavigation("/my-notes")}
          disabled={user?.verificationStatus !== "verified"}
        >
          {isActive("/my-notes") ? <NotesIcon color={Colors.primary} size={24} /> : <DisabledNotesIcon color={Colors.neutral50} size={24} />}
        </TouchableOpacity>
        
          <TouchableOpacity style={styles.fabButton} onPress={handleAddListing} disabled={user?.verificationStatus !== "verified"}>
            <Text 
              style={styles.fabIcon}
            >+</Text>
          </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("/my-listings")}
          disabled={user?.verificationStatus !== "verified"}
        >
          {isActive("/my-listings") ? <MyListingsIcon color={Colors.primary} size={24} /> : <DisabledMyListingsIcon color={Colors.neutral50} size={24} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("/profile")}
        >
          {isActive("/profile") ? <MaterialCommunityIcons name="account-circle" size={24} color={Colors.primary}/> : <MaterialCommunityIcons name="account-circle" size={24} color={Colors.neutral50}/>}
        </TouchableOpacity>

        <View style={styles.bottomBorder} />
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
  fabIcon: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: "300",
  },
})

