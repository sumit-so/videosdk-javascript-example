import "../src/style.css";
import { Device } from "./device";
import { createMeeting, validateMeeting } from "./config";
import { urlParams, setUrlParams, deleteUrlParams } from "./utils/url";

// DOM elements
// 1. screens
const joinScreen = document.getElementById("joinscreen");
const precallScreen = document.getElementById("pre-call");

// 2. subcomponents
const videoPreview = document.getElementById("camera-preview");
const inputMeetingId = document.getElementById("input-meeting-id");

// 3. buttons for navigation & actions
const createMeetingBtn = document.getElementById("create-meeting-btn");
const joinMeetingBtn = document.getElementById("join-meeting-btn");
const backToJoinScreenBtn = document.getElementById("back-to-joinscreen");
const micToggleBtn = document.getElementById("toggle-mic");
const webcamToggleBtn = document.getElementById("toggle-cam");

// 4. device(e.g camera/mic) selection dropdowns
const webcamDropdown = document.getElementById("camera-dropdown");
const micDropdown = document.getElementById("mic-dropdown");

// 5. loaders & fallback UIs
const appLoader = document.getElementById("loader");
const webcamFallbackUI = document.getElementById("webcam-fallback-ui");

// Application States
let meetingId = urlParams.searchParams.get("meetingId"); // meetingId or null
let webcamEnabled = true;
let micEnabled = true;

const deviceManager = new Device(
  webcamDropdown,
  micDropdown,
  videoPreview,
  webcamFallbackUI
);

(async () => {
  if (!meetingId) {
    changeScreen("join-screen");
  } else {
    appLoader.style.display = "block";
    const isValid = await validateMeeting(meetingId);
    if (!isValid) {
      deleteUrlParams("meetingId");
      changeScreen("join-screen");
    } else {
      await deviceManager.requestPermission();
      if (deviceManager.checkAudioVideoPermission) {
        await deviceManager.loadAllDevices();
        changeScreen("precall-screen");
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
  switch (screenType) {
    case "join-screen":
      joinScreen.style.display = "block";
      break;
    case "precall-screen":
      precallScreen.style.display = "block";
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

function handleBackToJoinscreen() {
  deleteUrlParams("meetingId");
  location.reload();
}

createMeetingBtn.addEventListener("click", () => handleMeeting(true));
joinMeetingBtn.addEventListener("click", () => handleMeeting(false));
backToJoinScreenBtn.addEventListener("click", () => handleBackToJoinscreen());

webcamDropdown.addEventListener(
  "change",
  async () => await deviceManager.toggleWebcam()
);
