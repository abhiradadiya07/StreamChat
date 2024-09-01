"use client";

import { OngoingCall, Participants, SocketUser } from "@/types";
import { useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

interface iSocketContext {
  onlineUsers: SocketUser[] | null;
  handleCall: (user: SocketUser) => void;
  handleJoinCall: (onGoingCall: OngoingCall) => void;
  onGoingCall: OngoingCall | null;
  localStream: MediaStream | null;
}
export const SocketContext = createContext<iSocketContext | null>(null);

export const SocketContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<SocketUser[] | null>(null);
  const [onGoingCall, setOnGoingCall] = useState<OngoingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const currentSocketUser = onlineUsers?.find(
    (onlineUsers) => onlineUsers.userId === user?.id
  );

  const getMediaStream = useCallback(
    async (faceMode?: string) => {
      if (localStream) return localStream;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 360, ideal: 720, max: 1080 },
            frameRate: { min: 16, ideal: 30, max: 30 },
            facingMode: videoDevices.length > 0 ? faceMode : undefined,
          },
        });
        setLocalStream(stream);
        return stream;
      } catch (error) {
        console.log("Failed to get localStreama", error);
        setLocalStream(null);
        return null;
      }
    },
    [localStream]
  );

  const handleCall = useCallback(
    async (user: SocketUser) => {
      if (!currentSocketUser || !socket) return;

      const stream = await getMediaStream();
      if (!stream) {
        console.log("No stream in handleCall");
        return;
      }
      const participants = { caller: currentSocketUser, receiver: user };
      setOnGoingCall({
        participants,
        isRinging: false,
      });
      socket.emit("call", participants);
    },
    [socket, onGoingCall, currentSocketUser]
  );

  const onIncomingCall = useCallback(
    (participants: Participants) => {
      setOnGoingCall({
        participants,
        isRinging: true,
      });
    },
    [socket, user, onGoingCall]
  );

  // Join Call
  const handleJoinCall = useCallback(
    (onGoingCall: OngoingCall) => {
      console.log(onGoingCall);
    },
    [socket, currentSocketUser]
  );
  // initializing a socket
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (socket === null) return;
    if (socket.connected) {
      onConnect();
    }
    function onConnect() {
      setIsSocketConnected(true);
    }
    function onDisConnect() {
      setIsSocketConnected(false);
    }
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisConnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisConnect);
    };
  }, [socket]);

  // setOnline Users
  useEffect(() => {
    if (!socket || !isSocketConnected) return;

    socket.emit("addNewUser", user);

    // get online users from server
    socket.on("getOnlineUsers", (res) => {
      setOnlineUsers(res);
    });

    return () => {
      socket.off("getOnlineUsers", (res) => {
        setOnlineUsers(res);
      });
    };
  }, [socket, isSocketConnected, user]);

  // calls
  useEffect(() => {
    if (!socket || !isSocketConnected) return;

    socket.on("incomingCall", onIncomingCall);
    return () => {
      socket.off("incomingCall", onIncomingCall);
    };
  }, [socket, isSocketConnected, onIncomingCall]);

  return (
    <SocketContext.Provider
      value={{
        onlineUsers,
        handleCall,
        handleJoinCall,
        onGoingCall,
        localStream,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error("useSocket must be used within a SocketContextProvider");
  }
  return context;
};
