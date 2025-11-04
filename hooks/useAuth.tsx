import { getToken, getUser } from "@/utils/secureStore";

export async function useAuth () {
    const token = await getToken();
    const user = await getUser();
    
    return { token, user };
}