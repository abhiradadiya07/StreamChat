import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { Button } from "./ui/button";

interface iVideoCantainer {
  stream: MediaStream | null;
  isLocalStream: boolean;
  isOnCall: boolean;
  //   isVideoOn: boolean;
}
const VideoContainer = ({
  stream,
  isLocalStream,
  isOnCall,
}: //   isVideoOn,
iVideoCantainer) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  //   const { user } = useUser();
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      console.log();
    }
  }, [stream]);

  return (
    <>
      <video
        className="rounded border w-[800px]"
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocalStream}
      />
      {/* <div>
        {isLocalStream ? <Button>Hello</Button> : <Button>World</Button>}
      </div> */}
    </>
  );
};

export default VideoContainer;
