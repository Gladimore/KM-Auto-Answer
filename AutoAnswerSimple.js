class TogetherClient {
  constructor(password) {
    this.apiKey = null;
    this.headers = {
      "Content-Type": "application/json",
    };
    this.apiEndpoint = "https://api.together.xyz/v1/chat/completions";
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
    this.model = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
    this.password = ""; // enter password in the quotes
    this.question = document.querySelector("legend").innerText;
    this.chatMessages = [
      {
        role: "system",
        content:
          "Be descriptive on how you got your answer. Have your answer be clear though, and have it at the top of text.",
      },
    ];
    this.togetherClient = new TogetherClient(this.password); // Use TogetherClient here
  }

  showNotification(message, isSuccess = true) {
    // Using console.log for notifications instead of DOM manipulation
    if (isSuccess) {
      console.log(`✅ Success: ${message}`);
    } else {
      console.log(`⚠ Error: ${message}`);
    }
  }

  getAllOptions() {
    return Array.from(this.tbody.querySelectorAll("tr"))
      .map((option) => option.children[2].innerText)
      .join("; ");
  }

  async sendToSmallerAI(answer) {
    const smallerAIModel = "meta-llama/Llama-3.2-3B-Instruct-Turbo";
    const prompt = `Extract the final answer from this explanation: ${answer}. Return only the answer without the explanation.`;

    try {
      const res = await this.togetherClient.send({
        messages: [
          { role: "system", content: "Extract the final answer from the explanation." },
          { role: "user", content: prompt },
        ],
        max_tokens: 512,
        stream: false,
        model: smallerAIModel,  // Send the request to the smaller AI model
      });

      this.handleResponse(res); // Handle the response from the smaller AI
    } catch (error) {
      this.showNotification(`Error in smaller AI: ${error.message}`, false);
    }
  }

  handleResponse(response) {
    if (response) {
      this.showNotification(`Final answer extracted: ${response}`);
    } else {
      this.showNotification("⚠ No final answer received", false);
    }
  }

  async send() {
    const prompt = `These are the options: ${this.getAllOptions()}. To this problem: ${this.question}. Also explain how you got that answer. Show your answer after explaining how you got it, and make sure your math is correct, or your answer is correct.`;

    try {
      const res = await this.togetherClient.send({
        messages: [...this.chatMessages, { role: "user", content: prompt }],
        max_tokens: 512,
        stream: false,
        model: this.model,
      });

      // Once the main AI response is received, send it to the smaller AI for extraction
      await this.sendToSmallerAI(res);
    } catch (error) {
      this.showNotification(`Error: ${error.message}`, false);
    }
  }
}

const quizHandler = new QuizHandler();
quizHandler.send();
