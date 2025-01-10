// Configuration object to control automatic clicking behavior
const config = {
  autoClickSubmitButton: true, // Set this to true to automatically click the submit button
};

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

    // List of models to try in order
    this.models = [
      "google/gemini-2.0-flash-exp:free",
      "google/gemini-2.0-flash-thinking-exp:free",
      "meta-llama/llama-3.1-70b-instruct:free",
      "meta-llama/llama-3.1-405b-instruct:free",
    ];

    this.currentModelIndex = 0; // Start with the first model
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

      return res; // Return the response from the smaller AI
    } catch (error) {
      this.showNotification(`Error in smaller AI: ${error.message}`, false);
    }
  }

  async validateAndFetchAnswer() {
    const prompt = `These are the options: ${this.getAllOptions()}. To this problem: ${this.question}. Also explain how you got that answer. Show your answer after explaining how you got it, and make sure your math is correct, or your answer is correct.`;

    const body = {
      model: this.models[this.currentModelIndex], // Use the current model
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
      const res = await this.openRouterClient.send(body);  // Get the answer from the first AI

      // Send the response to the smaller AI for validation
      const smallerAnswer1 = await this.sendToSmallerAI(res);

      // Call the main AI again and get a new answer
      const res2 = await this.openRouterClient.send(body);

      // Send the second response to the smaller AI
      const smallerAnswer2 = await this.sendToSmallerAI(res2);

      // Compare the two final answers from the smaller AIs
      const similarity = calculateSimilarity(smallerAnswer1, smallerAnswer2);

      // If the answers are similar enough, proceed
      if (similarity > 80) {
        this.showNotification("✅ Both smaller AI answers are similar.");
        this.findAndClickBestOption(smallerAnswer1); // Click the best matching option
      } else {
        this.showNotification("⚠ Smaller AI answers do not match, recalling...");
        this.validateAndFetchAnswer();  // Recall the process if the answers don't match
      }
    } catch (error) {
      this.showNotification(`Error with model ${this.models[this.currentModelIndex]}: ${error.message}`, false);

      // If the model fails, try the next one in the list
      if (this.currentModelIndex < this.models.length - 1) {
        this.currentModelIndex++;
        this.showNotification(`Trying model ${this.models[this.currentModelIndex]}...`);
        this.validateAndFetchAnswer(); // Retry the request with the next model
      } else {
        this.showNotification("⚠ All models have failed.", false);
      }
    }
  }
}

const quizHandler = new QuizHandler();
quizHandler.validateAndFetchAnswer();
