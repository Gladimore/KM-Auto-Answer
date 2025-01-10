// Function to calculate the Levenshtein distance between two strings
function levenshtein(a, b) {
  const tmp = [];

  // Ensure both strings have a length of at least 1
  const alen = a.length;
  const blen = b.length;

  // Create a matrix (2D array) to store the intermediate results
  for (let i = 0; i <= alen; i++) {
    tmp[i] = [i];
  }

  for (let j = 0; j <= blen; j++) {
    tmp[0][j] = j;
  }

  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      // Calculate the minimum cost for insertion, deletion, and substitution
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // Deletion
        tmp[i][j - 1] + 1, // Insertion
        tmp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  // Return the Levenshtein distance
  return tmp[alen][blen];
}

// Function to normalize strings by removing punctuation, extra spaces, and converting to lowercase
function normalize(str) {
  return str
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s]|_/g, "") // Remove punctuation
    .replace(/\s+/g, " "); // Normalize spaces (collapse multiple spaces into one)
}

// Function to calculate the similarity percentage using Levenshtein distance
function calculateSimilarity(str1, str2) {
  // Normalize the strings
  const normalizedStr1 = normalize(str1);
  const normalizedStr2 = normalize(str2);

  // Calculate the Levenshtein distance between the two normalized strings
  const levDistance = levenshtein(normalizedStr1, normalizedStr2);

  // Calculate similarity as a percentage (1 - distance/max_length) * 100
  const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);
  const similarity = ((maxLength - levDistance) / maxLength) * 100;

  return similarity; // Return the similarity as a percentage
}

class OpenRouterClient {
  constructor(password) {
    this.apiKey = null;
    this.headers = {
      "Content-Type": "application/json",
    };
    this.apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
    this.password = password;
  }

  async fetchApiKey() {
    const res = await fetch("https://together-key.vercel.app/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: this.password }),
    });

    const { key } = await res.json();
    this.apiKey = key;
    this.headers.Authorization = `Bearer ${key}`;
  }

  async send(body, callbacks = { onTextReceived: () => {}, onDone: () => {} }) {
    if (!this.apiKey) {
      await this.fetchApiKey();
    }

    this.callbacks = callbacks;

    const response = await fetch(this.apiEndpoint, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await this.handleNormalResponse(response); // Only using handleNormalResponse now
  }

  async handleNormalResponse(response) {
    const json = await response.json();
    console.log(json);
    const text = json.choices[0].message.content;
    this.callbacks.onTextReceived(text);
    this.callbacks.onDone();
    return text; // Return the response for non-stream responses
  }
}

class QuizHandler {
  constructor() {
    this.form = document.getElementById("quiz-form");
    this.tbody = this.form.querySelector("tbody");
    this.model = "google/gemini-2.0-flash-thinking-exp:free";
    this.password = ""; // enter password in the quotes
    this.question = document.querySelector("legend").innerText;
    this.chatMessages = [
      {
        role: "system",
        content:
          "Be descriptive on how you got your answer. Have your answer be clear though, and have it at the top of text.",
      },
    ];
    this.openRouterClient = new OpenRouterClient(this.password); // Use OpenRouterClient here
  }

  showNotification(message, isSuccess = true) {
    if (isSuccess) {
      console.log(`✅ Success: ${message}`);
    } else {
      console.log(`⚠ Error: ${message}`);
    }
  }

  getAllOptions() {
    return Array.from(this.tbody.querySelectorAll("tr")).map(
      (option) => option.children[2].innerText // Get the option text (column 3)
    );
  }

  // Find the option with the highest similarity and simulate a click on the radio button
  findAndClickBestOption(finalAnswer) {
    const options = this.getAllOptions();
    
    let highestSimilarity = 0;
    let bestMatchOption = null;

    options.forEach((option, index) => {
      const similarity = calculateSimilarity(finalAnswer, option);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatchOption = index;
      }
    });

    if (bestMatchOption !== null) {
      this.simulateOptionClick(bestMatchOption);
      if (config.autoClickSubmitButton) {
        this.enableAndSubmit(); // Automatically click the submit button if enabled in config
      }
    } else {
      this.showNotification("⚠ No matching option found.", false);
    }
  }

  // Simulate a click on the best matching radio button
  simulateOptionClick(optionIndex) {
    const radioButtons = this.tbody.querySelectorAll('input[type="radio"]');
    const radioButton = radioButtons[optionIndex]; // Select the radio button by its index
    if (radioButton) {
      radioButton.click(); // Simulate a click on the radio button
      this.showNotification(`✅ Option ${optionIndex + 1} clicked based on highest similarity.`);
    } else {
      this.showNotification(`⚠ No radio button found for option ${optionIndex + 1}`, false);
    }
  }

  // Enable the submit button and submit the form
  enableAndSubmit() {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.removeAttribute("disabled"); // Enable the submit button
      submitBtn.click(); // Simulate a click on the submit button
      this.showNotification("✅ Form submitted successfully.");
    } else {
      this.showNotification("⚠ Submit button not found", false);
    }
  }

  async sendToSmallerAI(answer) {
    const smallerAIModel = "meta-llama/llama-3.2-3b-instruct:free";
    const prompt = `Extract the final answer from this explanation: ${answer}. Return only the answer without the explanation.`;

    try {
      const res = await this.openRouterClient.send({
        model: smallerAIModel,
        messages: [
          { role: "system", content: "Extract the final answer from the explanation." },
          { role: "user", content: prompt },
        ],
        max_tokens: 512,
        stream: false,
      });

      this.handleResponse(res); // Handle the response from the smaller AI
    } catch (error) {
      this.showNotification(`Error in smaller AI: ${error.message}`, false);
    }
  }

  handleResponse(response) {
    if (response) {
      this.showNotification(`Final answer extracted: ${response}`);
      this.findAndClickBestOption(response); // Find and click the best matching option
    } else {
      this.showNotification("⚠ No final answer received", false);
    }
  }

  async send() {
    const prompt = `These are the options: ${this.getAllOptions()}. To this problem: ${this.question}. Also explain how you got that answer. Show your answer after explaining how you got it, and make sure your math is correct, or your answer is correct.`;

    const body = {
      model: this.model,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "Be descriptive on how you got your answer. Have your answer be clear though, and have it at the top of text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    try {
      const res = await this.openRouterClient.send(body);

      // Once the main AI response is received, send it to the smaller AI for extraction
      await this.sendToSmallerAI(res);
    } catch (error) {
      this.showNotification(`Error: ${error.message}`, false);
    }
  }
}

const quizHandler = new QuizHandler();
quizHandler.send();
