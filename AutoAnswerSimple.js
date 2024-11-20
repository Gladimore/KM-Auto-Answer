class AI {
  constructor(apiUrl, model, key) {
    this.apiUrl = apiUrl
    this.model = model
    this.key = key
  }

  async send(chatMessages = []) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatMessages: chatMessages,
        model: this.model,
        key: this.key,
      }),
    })

    return await response.json()
  }
}

class QuizHandler {
  constructor() {
    this.form = document.getElementById("quiz-form")
    this.tbody = this.form.querySelector("tbody")
    this.model = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
    this.password = window.atob("aWx5c20=")
    this.apiUrl = "https://llm-2-0.vercel.app/api/chat"
    this.question = document.querySelector("legend").innerText
    this.chatMessages = [
      {
        role: "system",
        content:
          "Keep your answer short and simple, while also showing how you got that answer.",
      },
    ]
    this.ai = new AI(this.apiUrl, this.model, this.password)
  }

  showNotification(message, isSuccess = true) {
    alert(message)
  }

  getAllOptions() {
    return Array.from(this.tbody.querySelectorAll("tr"))
      .map((option) => option.children[2].innerText)
      .join("; ")
  }

  handleResponse(response) {
    if (response) {
      this.showNotification(`Answer received: ${response}`)
    } else {
      this.showNotification("⚠ No answer received", false)
    }
  }

  async send() {
    const prompt = `These are the options: ${this.getAllOptions()}. To this problem: ${this.question}. I only need the answer, nothing else. For example option 1.`

    try {
      const res = await this.ai.send([
        ...this.chatMessages,
        { role: "user", content: prompt },
      ])

      this.handleResponse(res)
    } catch (error) {
      this.showNotification(`⚠ Error: ${error.message}`, false)
    }
  }
}

const quizHandler = new QuizHandler()
quizHandler.send()
