// >>> Global References
const watchFace = document.getElementById("handOverlay");
const handResting = document.getElementById("handResting");
var secondsElapsed = 0;
var showingAdvice = false;
const glanceButton = document.getElementById("glanceButton");
const startBtn = document.getElementById("start-btn");

const nothingBtn = document.getElementById("nothing-btn");
const eatBtn = document.getElementById("eat-btn");
const correctBtn = document.getElementById("correct-btn");

// >>> User interaction counter
var glanceCounter = 0;
var adviceCounter = 0;
var nothingBtnCounter = 0;
var eatBtnCounter = 0;
var correctBtnCounter = 0;
var userInteractionRecord = [];

var watchImage = document.querySelector(".image-fit");
var canPlaySound = false;
var watchClock = "10:01";

var timer = null;

var dexcomULS = new Audio("assets/Dexcom-ULS.mp3");
var dexcomHigh = new Audio("assets/Dexcom-high.mp3");
var dexcomHighBeep = new Audio("assets/Dexcom-high-beep.mp3");
var libreULS = new Audio("assets/Libre-ULS.mp3");
var libreHigh = new Audio("assets/Libre-high.mp3");
var medtronicHigh = new Audio("assets/Medtronic-high.mp3");
var medtronicULS = new Audio("assets/Medtronic-ULS.mp3");

function handleTimelineEvents(t, showingAdvice = false) {
  const index = Math.floor(t / 60);
  const entry = timeline[index];

  if (!entry) return;

  handResting.src = entry.resting;

  if (showingAdvice && entry.adv) {
    watchFace.src = entry.adv;
  } else {
    watchFace.src = entry.img;
  }

  if (t === 120) {
    // ⚠️ High alert
    canPlaySound = true;
    if (canPlaySound) {
      libreHigh.play().catch((err) => {
        console.warn("Playback blocked:", err);
      });
    } else {
      console.log("canPlaySound is false");
    }
  }
  if (t === 840) {
    // ⚠️ ULS alert
    canPlaySound = true;
    if (canPlaySound) {
      libreULS.play().catch((err) => {
        console.warn("Playback blocked:", err);
      });
    } else {
      console.log("canPlaySound is false");
    }
  }

  if (t === 1080) {
    // End program
    sendDataToGoogleSheet();
    window.alert("✅ Session Ended. Please pause the video.");
  }

  if (t === 1081) {
    // End program
    console.log(userInteractionRecord);
    clearInterval(timer); // stop timer
  }
}

document.addEventListener("DOMContentLoaded", function () {
  startBtn.addEventListener("click", () => {
    console.log("start-btn clicked");
    canPlaySound = false;
    startBtn.classList.add("disabled");
    startBtn.style.display = "none";
    [
      dexcomHigh,
      dexcomHighBeep,
      dexcomULS,
      libreULS,
      libreHigh,
      medtronicHigh,
      medtronicULS,
    ].forEach((audio) => {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch((err) => {
          console.warn("Audio unlock failed:", err);
        });
    });

    canPlaySound = true;
    startTimer();
  });

  // >>> Timer Logic
  function startTimer() {
    console.log("timer started");
    timer = setInterval(() => {
      secondsElapsed++;

      handleTimelineEvents(secondsElapsed, showingAdvice);

      // Record user interaction for this second
      const record = {
        Timestamp: secondsElapsed,
        GlanceClicked: glanceCounter,
        AdviceClicked: adviceCounter,
        NothingBtnClicked: nothingBtnCounter,
        EatBtnClicked: eatBtnCounter,
        CorrectBtnClicked: correctBtnCounter,
      };

      userInteractionRecord.push(record);

      // Reset counters for next second
      glanceCounter = 0;
      adviceCounter = 0;
      nothingBtnCounter = 0;
      eatBtnCounter = 0;
      correctBtnCounter = 0;
    }, 1000); // or 500ms if you prefer
  }

  // === Show tick feedback on button ===
  function showTick(btn) {
    const tick = btn.querySelector(".tick-feedback");
    if (tick) {
      tick.classList.add("show");
      setTimeout(() => tick.classList.remove("show"), 1000);
    }
  }

  // === User interaction: Treatment decision ===
  [nothingBtn, eatBtn, correctBtn].forEach((btn) => {
    btn.addEventListener("click", () => {
      showTick(btn);

      if (btn === nothingBtn) {
        nothingBtnCounter++;
        console.log("Nothing clicked: ", nothingBtnCounter);
      }
      if (btn === eatBtn) {
        eatBtnCounter++;
        console.log("Eat clicked: ", eatBtnCounter);
      }
      if (btn === correctBtn) {
        correctBtnCounter++;
        console.log("Correct clicked: ", correctBtnCounter);
      }
    });
  });
});

document.addEventListener("keydown", function (e) {
  if (e.code === "KeyA") {
    e.preventDefault(); // Prevent scrolling
    glanceCounter++;

    showingAdvice = false;
    handleTimelineEvents(secondsElapsed, showingAdvice);

    watchFace.classList.toggle("show");
    handResting.classList.toggle("hide");
  }
});

document.addEventListener("keydown", function (e) {
  if (e.code === "KeyS") {
    e.preventDefault();
    adviceCounter++;
    showingAdvice = !showingAdvice;
    handleTimelineEvents(secondsElapsed, showingAdvice);
  }
});

function sendDataToGoogleSheet() {
  const payload = new URLSearchParams();
  payload.append("data", JSON.stringify(userInteractionRecord));

  fetch("[insert your google sheet script here]", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("File saved:", data);
    })
    .catch((err) => console.error("Error sending data:", err));
}

var timeline = [
  {
    time: "10:00",
    bg: 13.5,
    resting: "assets/Handresting/10.00.png",
    img: "assets/Watchfaces/10.00.png",
    adv: "assets/Watchfaces/advice-high.png",
  },
  {
    time: "10:05",
    bg: 13.6,
    resting: "assets/Handresting/10.05.png",
    img: "assets/Watchfaces/10.05.png",
    adv: "assets/Watchfaces/advice-high.png",
  },
  {
    time: "10:10", // High alert
    bg: 14.0,
    resting: "assets/Handresting/10.10.png",
    img: "assets/Watchfaces/10.10.png",
    adv: "assets/Watchfaces/advice-high-alert.png",
  },
  {
    time: "10:15",
    bg: 12.9,
    resting: "assets/Handresting/10.15.png",
    img: "assets/Watchfaces/10.15.png",
    adv: "assets/Watchfaces/advice-high.png",
  },
  {
    time: "10:20",
    bg: 10.8,
    resting: "assets/Handresting/10.20.png",
    img: "assets/Watchfaces/10.20.png",
    adv: "assets/Watchfaces/advice-high.png",
  },
  {
    time: "10:25",
    bg: 10.6,
    resting: "assets/Handresting/10.25.png",
    img: "assets/Watchfaces/10.25.png",
    adv: "assets/Watchfaces/advice-high.png",
  },
  {
    time: "10:30",
    bg: 9.9,
    resting: "assets/Handresting/10.30.png",
    img: "assets/Watchfaces/10.30.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "10:35",
    bg: 8.5,
    resting: "assets/Handresting/10.35.png",
    img: "assets/Watchfaces/10.35.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "10:40",
    bg: 7.8,
    resting: "assets/Handresting/10.40.png",
    img: "assets/Watchfaces/10.40.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "10:45",
    bg: 7.5,
    resting: "assets/Handresting/10.45.png",
    img: "assets/Watchfaces/10.45.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "10:50",
    bg: 7.1,
    resting: "assets/Handresting/10.50.png",
    img: "assets/Watchfaces/10.50.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "10:55",
    bg: 6.4,
    resting: "assets/Handresting/10.55.png",
    img: "assets/Watchfaces/10.55.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "11:00",
    bg: 6.0,
    resting: "assets/Handresting/11.00.png",
    img: "assets/Watchfaces/11.00.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "11:05",
    bg: 5.5,
    resting: "assets/Handresting/11.05.png",
    img: "assets/Watchfaces/11.05.png",
    adv: "assets/Watchfaces/advice-ULS.png",
  },
  {
    time: "11:10", // ULS alert
    bg: 4.3,
    resting: "assets/Handresting/11.10.png",
    img: "assets/Watchfaces/11.10.png",
    adv: "assets/Watchfaces/advice-ULS.png",
  },
  {
    time: "11:15",
    bg: 4.3,
    resting: "assets/Handresting/11.15.png",
    img: "assets/Watchfaces/11.15.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "11:20",
    bg: 4.0,
    resting: "assets/Handresting/11.20.png",
    img: "assets/Watchfaces/11.20.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "11:25",
    bg: 3.9,
    resting: "assets/Handresting/11.25.png",
    img: "assets/Watchfaces/11.25.png",
    adv: "assets/Watchfaces/advice-in-range.png",
  },
  {
    time: "11:30",
    bg: 3.7,
    resting: "assets/Handresting/11.30.png",
    img: "assets/Watchfaces/11.30.png",
    adv: "assets/Watchfaces/advice-low.png",
  },
];
