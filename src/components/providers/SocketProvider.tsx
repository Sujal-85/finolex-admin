import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Request notification permission on mount if default, using a toast for user interaction
        if ("Notification" in window && Notification.permission === "default") {
            toast.message("Enable Notifications", {
                description: "Get real-time updates for payments and orders.",
                action: {
                    label: "Enable",
                    onClick: () => {
                        Notification.requestPermission().then((permission) => {
                            if (permission === "granted") {
                                new Notification("Notifications Enabled", {
                                    body: "You will now receive system notifications.",
                                    icon: "/logo.png"
                                });
                            }
                        });
                    },
                },
                duration: 10000,
            });
        }

        // Connect to the backend URL
        const socketURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "http://localhost:5000";
        const socketInstance = io(socketURL);

        socketInstance.on("connect", () => {
            console.log("Socket connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        // Helper to show system notification
        const showSystemNotification = (title: string, body: string) => {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, {
                    body,
                    icon: "/logo.png",
                    // vibrate: [200, 100, 200], // Optional: vibrate on mobile
                });
            }
        };

        // Payment Updates
        socketInstance.on("payment_updated", (data) => {
            console.log("Payment updated:", data);
            queryClient.invalidateQueries({ queryKey: ["payments"] });

            const title = "New Payment Received";
            const message = `₹${data.amount} from ${data.studentName}`;

            toast.info(title, { description: message });
            showSystemNotification(title, message);
        });

        // Other Notifications (Announcements, etc.)
        socketInstance.on("newNotification", (data: any) => {
            console.log("New notification received:", data);

            // Filter out meal reminders
            const isMealReminder =
                data.title?.toLowerCase().includes("breakfast") ||
                data.title?.toLowerCase().includes("lunch") ||
                data.title?.toLowerCase().includes("dinner") ||
                data.type === 'menu'; // Assuming type 'menu' is primarily for these cyclical reminders in scheduler.js

            if (isMealReminder) {
                return;
            }

            toast.info(data.title, { description: data.message });
            showSystemNotification(data.title, data.message);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [queryClient]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
