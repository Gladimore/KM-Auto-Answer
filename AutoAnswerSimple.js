class AI {
  constructor(apiUrl, model, password) {
    this.apiUrl = apiUrl
    this.model = model
    this.password = password
  }

  async send(requestBody = []) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        REQUEST: requestBody,
        PASSWORD: this.password,
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
    this.password = ""; //enter password in the quoates
    this.apiUrl = "https://llm-2-0.vercel.app/api/chat"
    this.question = document.querySelector("legend").innerText
    this.chatMessages = [
      {
        role: "system",
        content:
          "Be descriptive on how you got your answer. Have your answer be clear though, and have it at the top of text.",
      },
    ]
    this.ai = new AI(this.apiUrl, this.model, this.password)
  }

  showNotification(message, isSuccess = true) {
    console.log(message)
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
    const prompt = `These are the options: ${this.getAllOptions()}. To this problem: ${this.question}. Also explain how you got that answer. Show your answer after explinaing how you got it, and mkae usre your math is correct, or your answer is correct.`

    try {
      const res = await this.ai.send({
        messages: [...this.chatMessages, { role: "user", content: prompt }],
        max_tokens: 512,
        stream: false,
        model: this.model,
      })

      this.handleResponse(res)
    } catch (error) {
      this.showNotification(`⚠ Error: ${error.message}`, false)
    }
  }
}

const quizHandler = new QuizHandler()
quizHandler.send()
