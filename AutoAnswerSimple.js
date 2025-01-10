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
