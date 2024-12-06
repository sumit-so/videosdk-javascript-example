import "../src/style.css";
import { Device } from "./device";
import { mMeeting } from "./meeting";
import { createMeeting, validateMeeting } from "./config";
import { urlParams, setUrlParams, deleteUrlParams } from "./utils/url";

// DOM elements
// 1. screens
const joinScreen = document.getElementById("join-screen");
const precallScreen = document.getElementById("pre-call");
const meetingScreen = document.getElementById("meeting-screen");

// 2. subcomponents
const inputMeetingId = document.getElementById("input-meeting-id");
const inputParticipantName = document.getElementById("input-participant-name");

// 3. buttons for navigation & actions
const createMeetingBtn = document.getElementById("create-meeting-btn");
const joinMeetingBtn = document.getElementById("join-meeting-btn");
const startMeetingBtn = document.getElementById("start-meeting-btn");
const backToJoinScreenBtn = document.getElementById("back-to-joinscreen");
const controlMicBtn = document.getElementById("controls-mic");
const controlWebcamBtn = document.getElementById("controls-webcam");

// const micToggleBtn = document.getElementById("icon-toggle-mic");
const webcamToggleBtn = document.getElementById("icon-toggle-cam");
const camDisabledLine = document.getElementById("cam-disable-line");

// 4. device(e.g camera/mic) selection dropdowns
const webcamDropdown = document.getElementById("camera-dropdown");
const micDropdown = document.getElementById("mic-dropdown");

// 5. loaders & fallback UIs
const appLoader = document.getElementById("loader");

// Application States
let meetingId = urlParams.searchParams.get("meetingId"); // meetingId or null
let joinedStatus = urlParams.searchParams.get("joinedStatus");

const deviceManager = new Device(webcamDropdown, micDropdown);

(async () => {
  if (!meetingId) {
    changeScreen("join-screen");
  } else {
    const isValid = await validateMeeting(meetingId);
    if (!isValid) {
      deleteUrlParams("meetingId");
      if (joinedStatus) {
        deleteUrlParams("joinedStatus");
      }
      changeScreen("join-screen");
    } else {
      if (joinedStatus === "CONNECTED") {
        // render meeting screen
        changeScreen("meeting-screen");
      } else {
        // render pre-call
        deleteUrlParams("joinedStatus");
        await deviceManager.requestPermission();
        if (deviceManager.checkAudioVideoPermission) {
          await deviceManager.loadAllDevices();
          changeScreen("precall-screen");
        }
      }
    }
    appLoader.style.display = "none";
  }
})();

function changeScreen(screenType) {
  appLoader.style.display = "none";

  // Hide all screens initially
  joinScreen.style.display = "none";
  precallScreen.style.display = "none";
  meetingScreen.style.display = "none";

  switch (screenType) {
    case "join-screen":
      joinScreen.style.display = "block";
      break;
    case "precall-screen":
      precallScreen.style.display = "block";
      break;
    case "meeting-screen":
      meetingScreen.style.display = "flex";
      break;
    default:
      console.warn("Unknown screen type:", screenType);
  }
}

async function handleMeeting(isNewMeeting) {
  try {
    if (isNewMeeting) {
      // disable create meeting button
      createMeetingBtn.disabled = true;
      createMeetingBtn.innerText = "loading...";
      meetingId = await createMeeting();
    } else {
      meetingId = inputMeetingId.value;
      if (!meetingId) {
        alert("Please enter a meeting ID");
        return;
      }
      const isValid = await validateMeeting(meetingId);
      if (!isValid) {
        alert("Invalid meeting ID");
        return;
      }
    }
    setUrlParams("meetingId", meetingId);
    location.reload();
  } catch (error) {
    console.error("Error creating/joining meeting:", error);
  } finally {
    createMeetingBtn.disabled = false;
  }
}

// Function to display all participants
// function showParticipants(participants) {

// }

function handleBackToJoinscreen() {
  deleteUrlParams("meetingId");
  deleteUrlParams("joinedStatus");
  location.reload();
}

async function handleToggleCamera() {
  await deviceManager.toggleWebcam(deviceManager.currentCameraId);
  if (!deviceManager.isWebcamEnabled) {
    camDisabledLine.style.display = "block";
  } else {
    camDisabledLine.style.display = "none";
  }
}

function handleStartMeeting() {
  const participantName = inputParticipantName.value;
  if (!participantName) {
    alert("provide a name value");
    return;
  }

  const meetingInfo = {
    isWebcamEnabled: deviceManager.isWebcamEnabled,
    isMicEnabled: deviceManager.isMicEnabled,
    name: participantName,
    meetingId: meetingId,
  };

  console.log("meetinginfo", meetingInfo);
  const meeting = new mMeeting(meetingInfo);

  meeting.init();
  meeting.meeting.join();
  setUrlParams("joinedStatus", "CONNECTING");
  changeScreen("meeting-screen");
}

async function handleChangeWebcam() {
  await deviceManager.changeWebcam();
}

createMeetingBtn.addEventListener("click", () => handleMeeting(true));
joinMeetingBtn.addEventListener("click", () => handleMeeting(false));
backToJoinScreenBtn.addEventListener("click", () => handleBackToJoinscreen());
webcamToggleBtn.addEventListener(
  "click",
  async () => await handleToggleCamera()
);

webcamDropdown.addEventListener(
  "change",
  async () => await handleChangeWebcam()
);

startMeetingBtn.addEventListener("click", () => handleStartMeeting());
controlMicBtn.addEventListener("click", () => {});
