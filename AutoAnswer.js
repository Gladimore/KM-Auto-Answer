class QuizHandler {
  constructor() {
    this.form = document.getElementById("quiz-form")
    this.tbody = this.form.querySelector("tbody")
    this.model = "meta-llama/Llama-Vision-Free"
    this.password = "AI"
    this.question = document.querySelector("legend").innerText
    this.chatHistory = [
      {
        role: "system",
        content:
          `You're a helpful assistant that helps solves problems, your response should only be like this: "Option 1", "Example 1"`,
      },
    ]
  }

  showNotification(message, isSuccess = true) {
    const notification = document.createElement("div")
    let displayMessage = message

    if (message.includes("Answer received:")) {
      const [prefix, answer] = message.split("Answer received:")
      displayMessage = `
                <div class="notification-header">
                    <span class="sparkle">✨</span> Answer Found!
                </div>
                <div class="answer-content">${answer}</div>
            `
    }

    notification.innerHTML = `
            <div class="notification-content">
                ${displayMessage}
            </div>
            <div class="notification-close">×</div>
        `

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: clamp(12px, 3vw, 18px);
            border-radius: clamp(8px, 2vw, 12px);
            color: white;
            background: ${
              isSuccess
                ? "linear-gradient(135deg, #00b09b, #96c93d)"
                : "linear-gradient(135deg, #ff416c, #ff4b2b)"
            };
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: clamp(260px, 90vw, 380px);
            font-family: 'Segoe UI', Arial, sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
        `

    const notificationHeader = notification.querySelector(".notification-header")
    if (notificationHeader) {
      notificationHeader.style.cssText = `
                font-size: clamp(12px, 2vw, 16px);
                font-weight: bold;
                margin-bottom: 12px;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 8px;
            `
    }

    const sparkle = notification.querySelector(".sparkle")
    if (sparkle) {
      sparkle.style.cssText = `
                animation: sparkleRotate 2s infinite linear;
                display: inline-block;
            `
    }

    const answerContent = notification.querySelector(".answer-content")
    if (answerContent) {
      answerContent.style.cssText = `
                font-size: clamp(14px, 3vw, 18px);
                font-weight: bold;
                padding: clamp(6px, 2vw, 12px);
                background: rgba(255,255,255,0.2);
                border-radius: 8px;
                margin-top: 8px;
                text-align: center;
                letter-spacing: 0.5px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                box-shadow: inset 0 0 10px rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
            `
    }

    notification.querySelector(".notification-content").style.cssText = `
            flex-grow: 1;
            margin-right: 15px;
        `

    notification.querySelector(".notification-close").style.cssText = `
            font-size: clamp(16px, 4vw, 22px);
            cursor: pointer;
            padding: 0 5px;
            opacity: 0.8;
            transition: all 0.2s ease;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            height: 28px;
            width: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
        `

    notification.addEventListener("mouseover", () => {
      notification.style.transform = "translateY(-3px) scale(1.02)"
      notification.style.boxShadow = "0 15px 30px rgba(0,0,0,0.3)"
    })

    notification.addEventListener("mouseout", () => {
      notification.style.transform = "translateY(0) scale(1)"
      notification.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)"
    })

    notification.addEventListener("click", () => {
      notification.style.animation =
        "slideOut 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
      setTimeout(() => notification.remove(), 500)
    })

    const additionalStyle = document.createElement("style")
    additionalStyle.textContent = `
        @keyframes sparkleRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
            from { 
                transform: translateX(120%) scale(0.9);
                opacity: 0;
            }
            to { 
                transform: translateX(0) scale(1);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from { 
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            to { 
                transform: translateX(120%) scale(0.9);
                opacity: 0;
            }
        }
        /* Media Queries for responsiveness */
        @media (max-width: 768px) {
            .notification {
                width: 85vw;
                top: 15px;
                right: 15px;
                padding: 18px;
            }

            .notification-header {
                font-size: 14px;
            }

            .answer-content {
                font-size: 16px;
            }

            .notification-close {
                font-size: 20px;
                height: 26px;
                width: 26px;
            }
        }

        @media (max-width: 480px) {
            .notification {
                width: 90vw;
                padding: 14px;
            }

            .notification-header {
                font-size: 12px;
            }

            .answer-content {
                font-size: 14px;
            }

            .notification-close {
                font-size: 18px;
                height: 24px;
                width: 24px;
            }
        }

        @media (max-width: 320px) {
            .notification {
                width: 95vw;
                padding: 10px;
            }

            .notification-header {
                font-size: 10px;
            }

            .answer-content {
                font-size: 12px;
            }

            .notification-close {
                font-size: 16px;
                height: 22px;
                width: 22px;
            }
        }
    `
    document.head.appendChild(additionalStyle)

    document.body.appendChild(notification)
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
      const response = await fetch(
        "https://llm-xoyr.onrender.com/api/generate-text",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model: this.model,
            password: this.password,
            chatHistory: this.chatHistory,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const { data } = await response.json()
      this.handleResponse(data)
    } catch (error) {
      this.showNotification(`⚠ Error: ${error.message}`, false)
    }
  }
}

const quizHandler = new QuizHandler()
quizHandler.send()
