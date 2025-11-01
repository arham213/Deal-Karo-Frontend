import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar backgroundColor="#F8F9FA" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth flow */}
        <Stack.Screen name="(auth)/sign-in" options={{ title: "Sign In" }} />
        <Stack.Screen name="(auth)/sign-up" options={{ title: "Sign Up" }} />

        {/* Main app flow */}
        <Stack.Screen name="(main)/index" options={{ title: "Home" }} />
      </Stack>
    </>
  );
}