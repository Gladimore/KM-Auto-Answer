const prompt = document.querySelector('legend').innerText;
const tbody = document.querySelector('table tbody');
const config = {
    model: 'meta-llama/Llama-Vision-Free',
    password: 'AI',
    chatHistory: [{
        role: 'server',
        content: 'Only give the response, and thats it. Give the response exactly as the options.'
    }]
};

async function fetchResponse() {
    try {
        const response = await fetch('https://llm-xoyr.onrender.com/api/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, ...config })
        });
        
        const { data } = await response.json();
        alert(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

fetchResponse();
