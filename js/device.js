import { VideoSDK } from "@videosdk.live/js-sdk";

class Device {
  constructor(webcamDropdown, micDropdown, videoPreview, webcamFallbackUI) {
    this.cameras = VideoSDK.getCameras();
    this.microphones = VideoSDK.getMicrophones();
    this.webcamDropdown = webcamDropdown;
    this.micDropdown = micDropdown;
    this.checkAudioVideoPermission = null;
    this.videoPreview = videoPreview;
    this.webcamFallbackUI = webcamFallbackUI;
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
    if (this.checkAudioVideoPermission === null) {
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
    } finally {
      try {
        this.checkAudioVideoPermission = await VideoSDK.checkPermissions(
          VideoSDK.Constants.permission.AUDIO_AND_VIDEO
        );
      } catch (finalErr) {
        console.error("Error in final block:", finalErr);
      }
    }
  }

  async setDefaultCamera() {
    if (this.cameras && this.cameras.length > 0) {
      const defaultCamera = this.cameras[0]; // Use the first camera as default
      this.webcamDropdown.value = defaultCamera.deviceId;

      // Automatically enable the camera
      try {
        const videoTrack = await VideoSDK.createCameraVideoTrack({
          cameraId: defaultCamera.deviceId,
          multiStream: false,
        });

        this.videoPreview.srcObject = videoTrack;
        this.webcamFallbackUI.style.display = "none";
        this.videoPreview.style.display = "block";
      } catch (error) {
        console.error("Error accessing default video track:", error);
      }
    } else {
      console.warn("No cameras available to set as default.");
    }
  }

  async toggleWebcam() {
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
        this.videoPreview.style.display = "block";
      } catch (error) {
        console.error("Error accessing video track:", error);
      }
    }
  }
}

export { Device };
