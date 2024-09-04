"use client";

import { OngoingCall, Participants, PeerData, SocketUser } from "@/types";
import { useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import Peer, { SignalData } from "simple-peer";
interface iSocketContext {
  onlineUsers: SocketUser[] | null;
  onGoingCall: OngoingCall | null;
  localStream: MediaStream | null;
  peer: PeerData | null;
  isCallEnded: boolean;
  handleCall: (user: SocketUser) => void;
  handleJoinCall: (onGoingCall: OngoingCall) => void;
  hangUpCall: (data: {
    onGoingCall?: OngoingCall;
    isEmitHangup?: boolean;
  }) => void;
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
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<PeerData | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [isCallEnded, setIsCallEnded] = useState(false);

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
      setIsCallEnded(false);
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

  const hangUpCall = useCallback(
    async (data: {
      onGoingCall?: OngoingCall | null;
      isEmitHangup?: boolean;
    }) => {
      if (socket && user && data?.onGoingCall && data?.isEmitHangup) {
        socket.emit("hangup", {
          onGoingCall: data.onGoingCall,
          userHangingUpId: user.id,
        });
      }

      setOnGoingCall(null);
      setPeer(null);
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
        setLocalStream(null);
      }

      setIsCallEnded(true);
    },
    [socket, user, localStream]
  );
  // create peer
  const createPeer = useCallback(
    (stream: MediaStream, initiator: boolean) => {
      const iceServers: RTCIceServer[] = [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            // "stun:stun1.l.google.com:19302",
            // "stun:stun2.l.google.com:19302",
          ],
        },
      ];

      // const configuration = {
      //   iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Use STUN server
      // };
      // const peerConnection = new RTCPeerConnection(configuration);

      const peer = new Peer({
        stream,
        initiator,
        trickle: true,
        config: { iceServers },
      });

      peer.on("stream", (stream) => {
        setPeer((prevPeer) => {
          if (prevPeer) {
            return { ...prevPeer, stream };
          }
          return prevPeer;
        });
      });

      peer.on("error", console.error);
      peer.on("close", () =>
        hangUpCall({
          onGoingCall: onGoingCall ? onGoingCall : undefined,
          isEmitHangup: true,
        })
      );

      const rtcPeerConnection: RTCPeerConnection = (peer as any)._pc;

      rtcPeerConnection.oniceconnectionstatechange = async () => {
        if (
          rtcPeerConnection.iceConnectionState === "disconnected" ||
          rtcPeerConnection.iceConnectionState === "failed"
        ) {
          await hangUpCall({
            onGoingCall: onGoingCall ? onGoingCall : undefined,
            isEmitHangup: true,
          });
        }
      };
      return peer;
    },
    [onGoingCall, setPeer]
  );

  const completePeerConnection = useCallback(
    async (connectionData: {
      sdp: SignalData;
      onGoingCall: OngoingCall;
      isCaller: boolean;
    }) => {
      if (!localStream) {
        console.log("Missing local stream");
        return;
      }
      console.log("peer");

      if (peer) {
        peer.peerConnection?.signal(connectionData.sdp);
        return;
      }
      const newPeer = createPeer(localStream, true);
      setPeer({
        peerConnection: newPeer,
        participantUser: connectionData.onGoingCall.participants.receiver,
        stream: undefined,
      });

      newPeer.on("signal", async (data: SignalData) => {
        if (socket) {
          // emit offer
          socket.emit("webRtcSignal", {
            sdp: data,
            onGoingCall,
            isCaller: true,
          });
        }
      });
    },
    [localStream, peer, createPeer, onGoingCall]
  );

  // Join Call
  const handleJoinCall = useCallback(
    async (onGoingCall: OngoingCall) => {
      setIsCallEnded(false);
      setOnGoingCall((prev) => {
        if (prev) {
          return { ...prev, isRinging: false };
        }
        return prev;
      });

      const stream = await getMediaStream();
      if (!stream) {
        console.log("Could not get stream in handle join function");
        hangUpCall({
          onGoingCall: onGoingCall ? onGoingCall : undefined,
          isEmitHangup: true,
        });
        return;
      }

      const newPeer = createPeer(stream, true);

      setPeer({
        peerConnection: newPeer,
        participantUser: onGoingCall.participants.caller,
        stream: undefined,
      });

      newPeer.on("signal", async (data: SignalData) => {
        if (socket) {
          // emit offer
          socket.emit("webRtcSignal", {
            sdp: data,
            onGoingCall,
            isCaller: false,
          });
          console.log("sent");
        }
      });
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
    socket.on("webRtcSignal", completePeerConnection);
    socket.on("hangup", hangUpCall);
    return () => {
      socket.off("incomingCall", onIncomingCall);
      socket.off("webRtcSignal", completePeerConnection);
      socket.off("hangup", hangUpCall);
    };
  }, [
    socket,
    isSocketConnected,
    onIncomingCall,
    completePeerConnection,
    hangUpCall,
    user,
  ]);

  // Set up the peer connection and add the media stream tracks
  // const setupPeerConnection = (stream) => {
  //   const configuration = {
  //     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  //   };
  // peerConnection.current = new RTCPeerConnection(configuration);
  // Add each track from the local stream to the peer connection
  // stream.getTracks().forEach((track) => {
  //   peerConnection?.current.addTrack(track, stream);
  // });

  //   // // Listen for remote stream
  // peerConnection.current.ontrack = (event) => {
  //   setRemoteStream(event.streams[0]);
  // };

  //   // // Listen for ice candidate events
  // peerConnection.current.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       socketRef.current.send(
  //         JSON.stringify({
  //           type: "ice-candidate",
  //           candidate: event.candidate,
  //           roomID,
  //         })
  //       );
  //     }
  //   };
  // };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isCallEnded) {
      timeout = setTimeout(() => {
        setIsCallEnded(false);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [isCallEnded]);
  return (
    <SocketContext.Provider
      value={{
        onlineUsers,
        handleCall,
        handleJoinCall,
        onGoingCall,
        localStream,
        peer,
        hangUpCall,
        isCallEnded,
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
