const APP_URL = "https://api.videosdk.live";
const authToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2YzkwZDk3OS01NThiLTRiYjctOTUyYi1hZTE0MzZiNzJmYzIiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTczMjc3MTA2NSwiZXhwIjoxNzMzMzc1ODY1fQ.KRgBInhSzrgVwUBBN0AkDzsXW4vdv8S4Ly57ZLzpfBo";

// create Meeting
async function createMeeting() {
  const res = await fetch(`${APP_URL}/v2/rooms`, {
    method: "POST",
    headers: {
      Authorization: authToken,
      "Content-Type": "application/json",
    },
  });

  const { roomId } = await res.json();

  return roomId;
}

// validate Meeting
async function validateMeeting(meetingId) {
  try {
    const res = await fetch(`${APP_URL}/v2/rooms/validate/${meetingId}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const { roomId } = await res.json();
    return roomId === meetingId;
  } catch (error) {
    console.error("Validation failed:", error);
    return false; // Or handle as needed
  }
}

export { createMeeting, validateMeeting, authToken };
