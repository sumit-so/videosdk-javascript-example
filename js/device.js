import { VideoSDK } from "@videosdk.live/js-sdk";
const videoPreview = document.getElementById("camera-preview");
const webcamFallbackUI = document.getElementById("webcam-fallback-ui");

class Device {
  constructor(webcamDropdown, micDropdown) {
    this.cameras = VideoSDK.getCameras();
    this.microphones = VideoSDK.getMicrophones();
    this.webcamDropdown = webcamDropdown;
    this.micDropdown = micDropdown;
    this.checkAudioVideoPermission = null;
    this.currentVideoTrack = null;
    this.currentCameraId = null;
    this.videoPreview = videoPreview;
    this.webcamFallbackUI = webcamFallbackUI;
    this.isWebcamEnabled = false;
    this.isMicEnabled = false;
  }
  async loadAllDevices() {
    try {
      this.cameras = await VideoSDK.getCameras(); // Resolves to an array of camera devices
      this.microphones = await VideoSDK.getMicrophones(); // Resolves to an array of microphone devices

      if (Array.isArray(this.cameras) && this.cameras.length > 0) {
        this.populateDropdown(this.webcamDropdown, this.cameras);
        await this.setDefaultCamera();
      } else {
        console.warn("No cameras found.");
      }

      if (Array.isArray(this.microphones) && this.microphones.length > 0) {
        this.populateDropdown(this.micDropdown, this.microphones);
      } else {
        console.warn("No microphones found.");
      }
    } catch (err) {
      console.error("(Error) loading devices:", err);
    }
  }

  populateDropdown(dropdown, devices) {
    // dropdown.innerHTML = "";
    devices.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label;
      dropdown.appendChild(option);
    });
  }

  async checkPermission(permissionType) {
    if (!this.checkAudioVideoPermission) {
      console.log("Permission status not initialized: check device.js file");
      return;
    }
    const permissionStatus = this.checkAudioVideoPermission;

    if (!permissionStatus.get(permissionType)) {
      try {
        const reqVideoPermission = await VideoSDK.requestPermission(
          permissionType
        );
        const isGranted = reqVideoPermission.get(permissionType);

        if (!isGranted) {
          console.log(`${permissionType} permission is denied`);
        } else {
          console.log(`${permissionType} permission is granted`);
        }
      } catch (err) {
        console.log(`(Error) requesting ${permissionType} permission:`, err);
      }
    } else {
      console.log(`${permissionType} permission already granted!`);
    }
  }

  async requestPermission() {
    try {
      this.checkAudioVideoPermission = await VideoSDK.checkPermissions(
        VideoSDK.Constants.permission.AUDIO_AND_VIDEO
      );
    } catch (err) {
      console.log("(Error) during accessing current permission", err);
    }
    try {
      await this.checkPermission(VideoSDK.Constants.permission.AUDIO);
      await this.checkPermission(VideoSDK.Constants.permission.VIDEO);
    } catch (err) {
      console.log("(Error) during Audio/Video permission request:", err);
    }
  }

  async setDefaultCamera() {
    if (this.cameras && this.cameras.length > 0) {
      const defaultCamera = this.cameras[0]; // Use the first camera as default
      const cameraId = (this.webcamDropdown.value = defaultCamera.deviceId);

      // Automatically enable the camera
      try {
        await this.toggleWebcam(cameraId);
      } catch (error) {
        console.error("Error accessing default video track:", error);
      }
    } else {
      console.warn("No cameras available to set as default.");
    }
  }

  async toggleWebcam(cameraId) {
    try {
      if (this.isWebcamEnabled) {
        this.videoPreview.srcObject = null;
        this.webcamFallbackUI.style.display = "flex";
        this.videoPreview.style.display = "none";
        // this.currentCameraId = null;
        this.isWebcamEnabled = false;
      } else {
        const videoTrack = await VideoSDK.createCameraVideoTrack({
          cameraId,
          multiStream: false,
        });

        this.currentVideoTrack = videoTrack;
        this.videoPreview.srcObject = videoTrack;
        this.webcamFallbackUI.style.display = "none";
        this.videoPreview.style.display = "flex";
        this.currentCameraId = cameraId;
        this.isWebcamEnabled = true;

        console.log("Webcam enabled with camera:", cameraId);
      }
    } catch (error) {
      console.error("Error toggling webcam:", error);
    }
  }

  async changeWebcam() {
    const deviceID = this.webcamDropdown.value;

    if (!this.checkAudioVideoPermission.get("video")) {
      await this.requestPermission();
    } else {
      try {
        const videoTrack = await VideoSDK.createCameraVideoTrack({
          cameraId: deviceID,
          multiStream: false,
        });

        this.videoPreview.srcObject = videoTrack;
        this.webcamFallbackUI.style.display = "none";
        this.videoPreview.style.display = "flex";
        this.currentCameraId = deviceID;
      } catch (error) {
        console.error("Error accessing video track:", error);
      }
    }
  }
}

export { Device };
