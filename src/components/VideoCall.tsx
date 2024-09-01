"use client";

import React, { useCallback, useEffect, useState } from "react";
import VideoContainer from "./VideoContainer";
import { useSocket } from "@/context/SocketContext";
import { Button } from "./ui/button";
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from "react-icons/md";

const VideoCall = () => {
  const { localStream } = useSocket();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()[0];
      setIsVideoOn(videoTracks.enabled);
      const audioTracks = localStream.getAudioTracks()[0];
      setIsMicOn(audioTracks.enabled);
    }
  }, [localStream]);
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()[0];
      videoTracks.enabled = !videoTracks.enabled;
      setIsVideoOn(videoTracks.enabled);
    }
  }, [localStream]);

  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()[0];
      audioTracks.enabled = !audioTracks.enabled;
      setIsMicOn(audioTracks.enabled);
    }
  }, [localStream]);

  return (
    <div>
      <div>
        {localStream && (
          <VideoContainer
            stream={localStream}
            isLocalStream={true}
            isOnCall={false}
            // isVideoOn={isVideoOn}
          />
        )}
      </div>
      <div className="mt-10 flex items-center gap-4">
        <Button onClick={toggleMic}>
          {isMicOn && <MdMicOff size={28} />}
          {!isMicOn && <MdMic size={28} />}
        </Button>
        <Button className="bg-red-500 hover:bg-red-600">End Call</Button>
        <Button onClick={toggleVideo}>
          {isVideoOn && <MdVideocamOff size={28} />}
          {!isVideoOn && <MdVideocam size={28} />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
