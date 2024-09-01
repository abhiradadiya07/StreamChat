import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import React, { useEffect, useRef } from "react";

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
    }
  }, [stream]);

  return (
    <video
      className="rounded border w-[800px]"
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocalStream}
    />
    // <div>
    //   {/* {isVideoOn ? ( */}
    //   <video
    //     className="rounded border w-[800px]"
    //     ref={videoRef}
    //     autoPlay
    //     playsInline
    //     muted={isLocalStream}
    //   />
    //   {/* ) : ( */}
    //   {/* <div>Video is off</div> */}
    //   {/* )} */}
    // </div>
  );
};

export default VideoContainer;
