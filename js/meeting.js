import { VideoSDK } from "@videosdk.live/js-sdk";
import { authToken } from "./config";

const participantGrid = document.getElementById("participant-grid");

class mMeeting {
  constructor(meetingInfo) {
    const { isWebcamEnabled, isMicEnabled, name, meetingId } = meetingInfo;
    this.isWebcamEnabled = isWebcamEnabled;
    this.isMicEnabled = isMicEnabled;
    this.name = name;
    this.meetingId = meetingId;
    this.meeting = null;
  }

  init() {
    if (!authToken) {
      console.error("Invalid auth token");
      return;
    }

    // Configure VideoSDK
    VideoSDK.config(authToken);

    // Initialize the meeting
    this.meeting = VideoSDK.initMeeting({
      meetingId: this.meetingId,
      name: this.name,
      micEnabled: this.isMicEnabled,
      webcamEnabled: this.isWebcamEnabled,
    });

    // Event: Local participant joined
    this.meeting.on("meeting-joined", () => {
      this.addParticipant(this.meeting.localParticipant);
    });

    // Event: Local participant stream
    this.meeting.localParticipant.on("stream-enabled", (stream) => {
      console.log(
        "Meeting joined by local participant:",
        this.meeting.localParticipant
      );

      this.setTrack(stream, this.meeting.localParticipant.id);
    });

    // Event: New participant joined
    this.meeting.on("participant-joined", (participant) => {
      console.log("Remote participant joined:", participant);
      this.addParticipant(participant);

      participant.on("stream-enabled", (stream) => {
        console.log(
          `Stream enabled for participant ${participant.id}:`,
          stream
        );
        this.setTrack(stream, participant.id);
      });
    });

    // Event: Stream enabled for a participant
    this.meeting.on("stream-enabled", (stream) => {
      console.log(`Stream enabled`, stream);
    });

    // Event: Stream disabled for a participant
    this.meeting.on("stream-disabled", (stream) => {
      console.log("stream", stream);
      console.log(`Stream disabled for ${participant.id}:`, stream);
      this.clearTrack(stream, participant.id);
    });

    // Event: Participant left
    this.meeting.on("participant-left", (participant) => {
      console.log("Participant left:", participant);
      this.removeParticipant(participant.id);
    });
  }

  // Add participant to the UI
  addParticipant(participant) {
    const videoElem = this.createVideoElement(
      participant.id,
      participant.displayName
    );
    const audioElem = this.createAudioElement(participant.id);

    participantGrid.appendChild(videoElem);
    participantGrid.appendChild(audioElem);
  }

  // Remove participant from the UI
  removeParticipant(participantId) {
    console.log("Participant left:", participantId);

    // Find the participant's container (video-frame)
    const participantContainer = document.querySelector(
      `.video-frame[data-id="${participantId}"]`
    );

    if (participantContainer) {
      participantContainer.remove(); // Remove the entire container
      console.log(`Removed video-frame for participant ${participantId}`);
    } else {
      console.warn(`No video-frame found for participant ${participantId}`);
    }
  }

  // Create a video element
  createVideoElement(id, name) {
    const videoFrame = document.createElement("div");
    videoFrame.classList.add("video-frame");
    videoFrame.setAttribute("data-id", id); // Unique identifier for the participant
    const videoElem = document.createElement("video");
    videoElem.classList.add("video");
    videoElem.setAttribute("id", `v-${id}`);
    videoElem.setAttribute("autoplay", true);

    videoFrame.appendChild(videoElem);

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.textContent = name || "Participant";

    videoFrame.appendChild(overlay);

    return videoFrame;
  }

  // Create an audio element
  createAudioElement(id) {
    const audioElem = document.createElement("audio");
    audioElem.setAttribute("id", `a-${id}`);
    audioElem.setAttribute("autoplay", true);
    audioElem.style.display = "none";

    return audioElem;
  }

  // Set track for video or audio
  setTrack(stream, participantId) {
    const videoElem = document.getElementById(`v-${participantId}`);
    const audioElem = document.getElementById(`a-${participantId}`);

    if (stream.kind === "video" && videoElem) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(stream.track);
      videoElem.srcObject = mediaStream;

      videoElem.play().catch((err) => console.error("Video play failed:", err));
    }

    if (stream.kind === "audio" && audioElem) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(stream.track);
      audioElem.srcObject = mediaStream;

      audioElem.play().catch((err) => console.error("Audio play failed:", err));
    }
  }

  // Clear track for a participant
  clearTrack(stream, participantId) {
    if (stream.kind === "video") {
      const videoElem = document.getElementById(`v-${participantId}`);
      if (videoElem) videoElem.srcObject = null;
    }

    if (stream.kind === "audio") {
      const audioElem = document.getElementById(`a-${participantId}`);
      if (audioElem) audioElem.srcObject = null;
    }
  }

  leaveMeeting() {
    if (this.meeting) {
      this.meeting.leave();
    } else {
      console.error("Meeting is not initialized.");
    }
  }

  endMeeting() {
    if (this.meeting) {
      this.meeting.end();
    } else {
      console.error("Meeting is not initialized.");
    }
  }
}

export { mMeeting };
