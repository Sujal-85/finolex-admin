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
        // Connect to the backend URL
        // Assuming backend is on localhost:5000 or same host as api
        const socketInstance = io("http://localhost:5000");

        socketInstance.on("connect", () => {
            console.log("Socket connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        // Global listener for updates
        // You can listen to specific events or a generic 'data_update'
        socketInstance.on("payment_updated", (data) => {
            console.log("Payment updated:", data);
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            toast.info("New payment received", {
                description: `₹${data.amount} from ${data.studentName}`
            });
        });

        // Add more listeners as needed for other entities
        // socketInstance.on("menu_updated", () => queryClient.invalidateQueries({ queryKey: ["menu"] }));

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
