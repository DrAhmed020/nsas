/***************************************************
 * دالة إيقاف جلسة PPP Active (إرسال أمر disable)
 **************************************************/
async function stopPPPActiveSession(sessionId, userName, btnElement) {
  if (!confirm(`هل أنت متأكد من إيقاف جلسة المستخدم ${userName}؟`))
    return;

  let formData = new FormData();
  formData.append("sessionId", sessionId);
  formData.append("username", userName);
  formData.append("cmd", "disable");

  try {
    let response = await fetch("api/index.php?action=stopActive", {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    if (result.success) {
      alert(result.message);
      logOperation("إيقاف جلسة " + userName + ": " + result.message);
      btnElement.textContent = "تشغيل";
      btnElement.style.backgroundColor = "green";
      btnElement.onclick = function() {
        enablePPPActiveSession(sessionId, userName, btnElement);
      };
      loadConnectedUsers();
    } else {
      alert(result.error || "حدث خطأ أثناء إيقاف الجلسة.");
    }
  } catch (error) {
    console.error("Error stopping PPP session:", error);
    alert("تعذر إيقاف الجلسة.");
  }
}

/***************************************************
 * دالة تشغيل جلسة PPP Active (إرسال أمر enable)
 **************************************************/
async function enablePPPActiveSession(subscriberId, userName, btnElement) {
  if (!confirm(`هل أنت متأكد من تشغيل جلسة المستخدم ${userName}؟`))
    return;

  let formData = new FormData();
  formData.append("id", subscriberId);
  formData.append("username", userName);

  try {
    let response = await fetch("api/enable.php", {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    if (result.success) {
      alert(result.message);
      logOperation("تشغيل جلسة " + userName + ": " + result.message);
      btnElement.textContent = "تعطيل";
      btnElement.style.backgroundColor = "red";
      btnElement.onclick = function() {
        stopPPPActiveSession(subscriberId, userName, btnElement);
      };
      loadConnectedUsers();
    } else {
      alert(result.error || "حدث خطأ أثناء تشغيل الجلسة.");
    }
  } catch (error) {
    console.error("Error enabling PPP session:", error);
    alert("تعذر تشغيل الجلسة.");
  }
}

export { stopPPPActiveSession, enablePPPActiveSession };