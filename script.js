document.addEventListener("DOMContentLoaded", () => {
  const chatBody = document.querySelector(".chat-body");
  const messageInput = document.querySelector(".message-input");
  const sendMessageButton = document.querySelector("#send-message");
  const fileInput = document.querySelector("#file-input");
  const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
  const fileCancelButton = document.querySelector("#file-cancel");
  const chatbotToggler = document.querySelector("#chatbot-toggler");
  const closeChatbot = document.querySelector("#close-chatbot");

  //API setup
  const API_KEY = "AIzaSyBqoGdWkQjbMzQb1KpS0JpwdRzmdC41H-4";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const userData = {
    message: null,
    file: {
      data: null,
      mime_type: null,
    },
  };

  const chatHistory = [];
  const initialInputHeight = messageInput.scrollHeight;

  //Create message element with dynamic classes and return it
  const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
  };

  //Generate bot response using API
  const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    //Add user message to chat history
    chatHistory.push({
      role: "user",
      parts: [
        { text: userData.message },
        ...(userData.file.data ? [{ inline_data: userData.file }] : []),
      ],
    });

    //API request options
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory,
      }),
    };

    try {
      //Fetch bot response from API
      const response = await fetch(API_URL, requestOptions);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);

      //Extract and display bot's response text
      const apiResponseText = data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();
      messageElement.textContent = apiResponseText;

      //Add bot reponse to chat history
      chatHistory.push({
        role: "model",
        parts: [
          { text: userData.message },
          ...(userData.file.data ? [{ inline_data: userData.file }] : []),
        ],
      });
    } catch (error) {
      //Handle error in API response
      console.log(error);
      messageElement.textContent = "There was an error getting the response.";
      messageElement.style.color = "#ff0000";
    } finally {
      //Reset user's file data, removing thinking indicator and scroll chat to bottom
      userData.file = {};
      incomingMessageDiv.classList.remove("thinking");
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
  };

  //Handle outgoing user messages
  const handleOutgoingMessage = () => {
    userData.message = messageInput.value.trim();
    if (!userData.message) return;
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    //Create and display user message
    const messageContent = `<div class="message-text"></div>
    ${
      userData.file.data
        ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
        : ""
    }`;
    const outgoingMessageDiv = createMessageElement(
      messageContent,
      "user-message"
    );
    outgoingMessageDiv.querySelector(".message-text").textContent =
      userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    //Simulate bot response with thinking indicator after a delay
    setTimeout(() => {
      const messageContent = `<svg
            class="bot-avatar"
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#5f6368"
          >
            <path
              d="M261.7-140.78q-98.92 0-169.07-68.09-70.15-68.09-70.15-166.43 0-83.66 47.85-150.03 47.84-66.37 127.8-84.5 28.39-94.26 106.22-151.82 77.82-57.57 175.65-57.57 119.83 0 205 82.07 85.17 82.06 91.39 201.32 70.7 14.22 115.92 69.68 45.21 55.45 45.21 127.85 0 82.34-57.58 139.93-57.59 57.59-139.94 57.59H261.7Z"
            />
          </svg>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;
      const incomingMessageDiv = createMessageElement(
        messageContent,
        "bot-message",
        "thinking"
      );
      chatBody.appendChild(incomingMessageDiv);
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      generateBotResponse(incomingMessageDiv);
    }, 100);

    messageInput.value = "";
  };

  //Handle enter key press for sending messages
  messageInput.addEventListener("keydown", (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      window.innerWidth > 768 &&
      messageInput.value.trim()
    ) {
      e.preventDefault();
      handleOutgoingMessage();
    }
  });

  //Adjust input field dynamically
  messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius =
      messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
  });

  //Handle file input change and preview the selected file
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      fileUploadWrapper.querySelector("img").src = e.target.result;
      fileUploadWrapper.classList.add("file-uploaded");
      const base64String = e.target.result.split(",")[1];

      //Store file data in userData
      userData.file = {
        data: base64String,
        mime_type: file.type,
      };

      fileInput.value = "";
    };

    reader.readAsDataURL(file);
  });

  sendMessageButton.addEventListener("click", () => {
    handleOutgoingMessage();
  });

  //Cancel file upload
  fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
  });

  //Initialize emoji picker and handle emoji selection
  const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
      const { selectionStart: start, selectionEnd: end } = messageInput;
      messageInput.setRangeText(emoji.native, start, end, "end");
      messageInput.focus();
    },
    onClickOutside: (e) => {
      if (e.target.id === "emoji-picker") {
        document.body.classList.toggle("show-emoji-picker");
      } else {
        document.body.classList.remove("show-emoji-picker");
      }
    },
  });

  document.querySelector(".chat-form").appendChild(picker);

  document
    .querySelector("#file-upload")
    .addEventListener("click", () => fileInput.click());
  chatbotToggler.addEventListener("click", () =>
    document.body.classList.toggle("show-chatbot")
  );
  closeChatbot.addEventListener("click", () =>
    document.body.classList.remove("show-chatbot")
  );

  //Weather App
  const apiKey = "7229664f031822f609f2f4bd8e0811aa";
  const apiUrl =
    "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

  const searchBox = document.querySelector(".search input");
  const searchBtn = document.querySelector(".search button");
  const weatherIcon = document.querySelector(".weather-icon");

  async function checkWeather(city) {
    const response = await fetch(apiUrl + city + `&appid=${apiKey}`);

    if (response.status == 404) {
      document.querySelector(".weather").style.display = "none";
      document.querySelector(".error").style.display = "block";
    } else {
      var data = await response.json();

      document.querySelector(".city").innerHTML = data.name;
      document.querySelector(".temp").innerHTML =
        Math.round(data.main.temp) + "°c";
      document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
      document.querySelector(".wind").innerHTML = data.wind.speed + "km/h";

      if (data.weather[0].main == "Clouds") {
        weatherIcon.src = "Images/clouds.png";
      } else if (data.weather[0].main == "Clear") {
        weatherIcon.src = "Images/clear.png";
      } else if (data.weather[0].main == "Rain") {
        weatherIcon.src = "Images/rain.png";
      } else if (data.weather[0].main == "Drizzle") {
        weatherIcon.src = "Images/drizzle.png";
      } else if (data.weather[0].main == "Mist") {
        weatherIcon.src = "Images/mist.png";
      }

      document.querySelector(".weather").style.display = "block";
      document.querySelector(".error").style.display = "none";
    }
  }

  searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
  });

  //Carbon Calculator
  document
    .getElementById("carbonForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      // Collect inputs
      const electricityUsage = parseFloat(
        document.getElementById("electricity").value || 0
      ); // kWh per day
      const kilometersDriven = parseFloat(
        document.getElementById("transport").value || 0
      ); // km per day
      const diet = document.getElementById("diet").value; // Diet type
      const hasNoCar = document.getElementById("noCar").checked; // Checkbox for car ownership

      // Emission Factors (per unit activity)
      const electricityEmissionFactor = 0.2; // kg CO₂ per kWh
      const carEmissionFactor = 0.21; // kg CO₂ per km
      const dietEmissionFactors = {
        meat: 6.85, // kg CO₂ per day for a meat-based diet
        vegetarian: 3.29, // kg CO₂ per day for a vegetarian diet
        vegan: 2.74, // kg CO₂ per day for a vegan diet
      };

      // Daily average carbon footprint in developing countries
      const averageDailyCarbonFootprint = 6.85; // kg CO₂ per day (from global averages)

      // Calculate emissions
      const electricityEmissions = electricityUsage * electricityEmissionFactor;
      const carEmissions = hasNoCar ? 0 : kilometersDriven * carEmissionFactor;
      const dietEmissions = dietEmissionFactors[diet];

      // Total daily emissions
      const totalDailyEmissions =
        electricityEmissions + carEmissions + dietEmissions;

      // Determine if footprint is low or high
      const isHighFootprint = totalDailyEmissions > averageDailyCarbonFootprint;
      const resultText = isHighFootprint
        ? `<span class="high">Your daily carbon footprint is high</span>`
        : `<span class="low">Your daily carbon footprint is low</span>`;
      const resultClass = isHighFootprint ? "high" : "low";

      // Display result
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML = `<span class="${resultClass}">${resultText}</span> (Your estimated daily carbon footprint is <strong>${totalDailyEmissions.toFixed(
        2
      )} kg CO₂/day</strong>)`;
    });
});
