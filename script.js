document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const sendCountInput = document.getElementById('sendCount');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const responseMessage = document.getElementById('responseMessage');
    const logArea = document.getElementById('logArea');

    let isSending = false;
    let currentSendCount = 0;
    let abortController = null;

    function addLog(message, type = '') {
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logEntry.classList.add('log-entry');
        if (type) {
            logEntry.classList.add(type);
        }
        logArea.prepend(logEntry);
        if (logArea.children.length > 100) {
            logArea.removeChild(logArea.lastChild);
        }
    }

    function updateButtonState() {
        startButton.disabled = isSending;
        stopButton.disabled = !isSending;
    }

    async function sendEmail() {
        const email = emailInput.value;
        const url = 'https://id.stpr.com/api/email/signup-provision';
        const data = {
            email: email,
            accept: true
        };
 
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: signal
            });

            if (response.ok) {
                const result = await response.json(); 
                addLog(`[+] ${email}… ${response.status}`, 'success');
                return true; 
            } else {
                const errorText = await response.text();
                addLog(`[-] ${email}… ${response.status} - ${errorText || response.statusText}`, 'error');
                return false; 
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                addLog(`[-] ${email}… リクエストが中断されました。`, 'error');
            } else {
                addLog(`[-] ${email}… ${error.message}`, 'error');
            }
            console.error('Fetch error:', error);
            return false; 
        }
    }

    async function startSending() {
        if (isSending) return; 

        const totalSendCount = parseInt(sendCountInput.value, 10); 
        if (isNaN(totalSendCount) || totalSendCount <= 0) {
            responseMessage.textContent = '送信回数を指定してください';
            responseMessage.classList.add('error');
            return;
        }

        isSending = true;
        currentSendCount = 0;
        responseMessage.textContent = '';
        responseMessage.className = 'message';
        logArea.innerHTML = ''; 
        addLog('--- 送信開始 ---', 'info');
        updateButtonState();

        while (isSending && currentSendCount < totalSendCount) {
            currentSendCount++;
            addLog(`送信 #${currentSendCount}/${totalSendCount}...`);

            if (!isSending) {
                addLog('送信が停止されました。');
                break;
            }

            const success = await sendEmail();
            
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        isSending = false;
        updateButtonState();
        addLog('┈┈┈┈┈┈┈┈┈┈', 'info');
        if (currentSendCount >= totalSendCount) {
            responseMessage.textContent = `送信完了😾`;
            responseMessage.classList.add('success');
        } else {
            responseMessage.textContent = `✅`;
            responseMessage.classList.add('error');
        }
    }

    function stopSending() {
        if (!isSending) return;

        isSending = false;
        if (abortController) {
            abortController.abort();
        }
        updateButtonState();
        addLog('送信停止します', 'info');
    }

    startButton.addEventListener('click', startSending);
    stopButton.addEventListener('click', stopSending);

    updateButtonState();
});
