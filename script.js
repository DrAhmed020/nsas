/***************************************************
 * تغيير عرض الأقسام الرئيسية بناءً على التبويبات
 **************************************************/
function showSection(index) {
  const sections = document.querySelectorAll(".section");
  sections.forEach((sec, i) => {
    sec.classList.toggle("active", i === index);
  });
  
  // تحديث حالة أزرار التبويبات الرئيسية (0: المشتركين، 1: إضافة، 2: السجل، 3: إدارة المشتركين)
  document.getElementById("tabListBtn").classList.toggle("active", index === 0);
  document.getElementById("tabAddBtn").classList.toggle("active", index === 1);
  document.getElementById("tabLogBtn").classList.toggle("active", index === 2);

  // تبويب إدارة المشتركين (index === 3)
  const manageTabBtn = document.getElementById("tabManageBtn");
  if (manageTabBtn) {
    manageTabBtn.classList.toggle("active", index === 3);
  }

  // إذا اخترنا تبويب إدارة المشتركين، نظهر القسم manageSection
  if (index === 3) {
    // العرض الافتراضي سيكون المتصلين
    showManageSubsection(0);
  }
}

/***************************************************
 * دالة التحكم في التبويبات الفرعية لقسم إدارة المشتركين
 * (المتصلين: subIndex = 0) - (الجميع: subIndex = 1)
 **************************************************/
function showManageSubsection(subIndex) {
  const subsections = document.querySelectorAll(".manage-subsection");
  subsections.forEach((sub, i) => {
    sub.classList.toggle("active", i === subIndex);
  });

  // تحديث حالة الأزرار الفرعية
  document.getElementById("tabConnectedBtn").classList.toggle("active", subIndex === 0);
  document.getElementById("tabAllBtn").classList.toggle("active", subIndex === 1);

  // استدعاء الدوال المناسبة لجلب البيانات
  if (subIndex === 0) {
    // المتصلين
    loadConnectedUsers();
  } else {
    // الجميع
    loadAllUsers();
  }
}

/***************************************************
 * دالة لجلب المشتركين المتصلين حاليًا من MikroTik
 * عبر API (نحتاج إلى تجهيز api/index.php?action=connected)
 **************************************************/
async function loadConnectedUsers() {
  const container = document.getElementById("connectedList");
  container.innerHTML = "جاري تحميل المتصلين...";

  try {
    // استدعاء نقطة النهاية (endpoint) لجلب قائمة المتصلين
    let response = await fetch("api/index.php?action=connected");
    let result = await response.json();

    container.innerHTML = ""; // تفريغ المحتوى القديم

    if (result.success) {
      let activeUsers = result.data;
      if (!activeUsers || !Array.isArray(activeUsers) || activeUsers.length === 0) {
        container.innerHTML = "<p>لا يوجد متصلين حاليًا.</p>";
        return;
      }
      activeUsers.forEach(user => {
        const card = document.createElement("div");
        card.classList.add("subscriber-card");
        
        // على سبيل المثال: user.name = اسم اليوزر، user.address = IP، user["caller-id"] = MAC، user.profile = Profile
        const userName  = user.name  || "unknown";
        const ipAddress = user.address || "N/A";
        const callerId  = user["caller-id"] || "N/A";
        const profile   = user.profile || "N/A";

        // بناء محتوى البطاقة مع الأزرار.
        // بالنسبة لجلسة الـPPP Active نفترض أن المستخدم متصل، لذا الزر يبدأ بنص "تعطيل" ولونه أحمر.
        card.innerHTML = `
  <h3>${userName}</h3>
  <p><strong>IP:</strong> ${ipAddress}</p>
  <p><strong>MAC:</strong> ${callerId}</p>
  <p><strong>Profile:</strong> ${profile}</p>
  <div class="card-buttons">
    <!-- أمثلة: تفعيل/تعديل/حذف -->
    <button class="btn-activate" onclick="toggleActivationPPP('${userName}')">تفعيل</button>
    <button class="btn-edit" onclick="editSubscriberByUser('${userName}')">تعديل</button>
    <!-- زر لإيقاف جلسة PPP Active -->
    <button class="btn-stop" 
      onclick="stopPPPActiveSession('${user['.id']}', '${userName}', this)" 
      style="background-color: red;">
      تعطيل
    </button>
    <!-- زر لتشغيل جلسة PPP Active بشكل منفصل -->
    <button class="btn-enable" 
      onclick="enablePPPActiveSession('${user['.id']}', '${userName}', this)" 
      style="background-color: green;">
      تشغيل
    </button>
    <button class="btn-delete" onclick="deleteSubscriberByUser('${userName}')">حذف</button>
  </div>
`;
container.appendChild(card);

      });
    } else {
      container.innerHTML = `<p>خطأ: ${result.error || 'لا يمكن جلب البيانات'}</p>`;
    }
  } catch (error) {
    console.error("Error loading connected users:", error);
    container.innerHTML = "<p>حدث خطأ أثناء جلب المتصلين.</p>";
  }
}

/***************************************************
 * دالة لعرض جميع المشتركين في قسم "الجميع"
 * يمكننا ببساطة إعادة استخدام loadSubscribers()
 **************************************************/
function loadAllUsers() {
  // الحل المؤقت: إعادة استخدام loadSubscribers ثم نسخ المحتوى
  loadSubscribers();
  setTimeout(() => {
    const mainList = document.getElementById("subscribersList");
    const allList = document.getElementById("allList");
    allList.innerHTML = mainList.innerHTML;
  }, 1000);
}

/***************************************************
 * دالة إيقاف جلسة PPP Active (إرسال أمر disable)
 * عند النقر على الزر:
 * - يتم طلب تأكيد المستخدم.
 * - يتم إرسال طلب POST إلى endpoint "api/index.php?action=stopActive".
 * - بعد النجاح، يتم تغيير نص الزر إلى "تشغيل" ولونه أخضر وتحديث دالة النقر لتصبح enablePPPActiveSession.
 *
 * @param {string|number} sessionId - معرف الجلسة (من MikroTik)
 * @param {string} userName - اسم المستخدم
 * @param {HTMLElement} btnElement - العنصر الزر الذي تم النقر عليه
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
      // تحديث الزر: تغيير النص إلى "تشغيل" ولونه أخضر
      btnElement.textContent = "تشغيل";
      btnElement.style.backgroundColor = "green";
      // تغيير دالة النقر إلى enablePPPActiveSession
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
 * عند النقر على الزر:
 * - يتم طلب تأكيد المستخدم.
 * - يتم إرسال طلب POST إلى endpoint "api/enable.php".
 * - بعد النجاح، يتم تغيير نص الزر إلى "تعطيل" ولونه أحمر وتحديث دالة النقر لتصبح stopPPPActiveSession.
 *
 * @param {string|number} subscriberId - معرف المشترك (من قاعدة البيانات والمطابق لـ MikroTik)
 * @param {string} userName - اسم المستخدم
 * @param {HTMLElement} btnElement - العنصر الزر الذي تم النقر عليه
 **************************************************/
async function enablePPPActiveSession(subscriberId, userName, btnElement) {
  if (!confirm(`هل أنت متأكد من تشغيل جلسة المستخدم ${userName}؟`))
    return;

  let formData = new FormData();
  formData.append("id", subscriberId);
  formData.append("username", userName);
  // إرسال أمر enable إلى ملف enable.php
  try {
    let response = await fetch("api/enable.php", {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    if (result.success) {
      alert(result.message);
      logOperation("تشغيل جلسة " + userName + ": " + result.message);
      // تحديث الزر: تغيير النص إلى "تعطيل" ولونه أحمر
      btnElement.textContent = "تعطيل";
      btnElement.style.backgroundColor = "red";
      // تغيير دالة النقر إلى stopPPPActiveSession
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

/***************************************************
 * مثال: تفعيل PPP Account (إذا كان معطّل)
 **************************************************/
function toggleActivationPPP(userName) {
  alert(`سيتم تنفيذ تفعيل ${userName}...`);
  logOperation(`تفعيل المستخدم ${userName}`);
}

/***************************************************
 * مثال: تعديل المشترك بالاعتماد على userName
 * (يجب عمل دالة في الـ API لجلب بياناته من DB أو ppp/secret)
 **************************************************/
function editSubscriberByUser(userName) {
  alert(`سيتم جلب بيانات المشترك حسب user=${userName} وعرض نموذج التعديل.`);
  logOperation(`تعديل المستخدم ${userName}`);
}

/***************************************************
 * مثال: حذف المشترك بالاعتماد على userName
 **************************************************/
function deleteSubscriberByUser(userName) {
  if (!confirm(`هل أنت متأكد من حذف المستخدم ${userName}؟`))
    return;
  alert(`سيتم حذف المستخدم ${userName} من DB و MikroTik إن وجد.`);
  logOperation(`حذف المستخدم ${userName}`);
}

/***************************************************
 * الدوال القديمة (filterSubscribers, loadSubscribers، إلخ)
 **************************************************/

// تصفية المشتركين في قائمة "المشتركين"
function filterSubscribers() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".subscriber-card");
  cards.forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(filter) ? "block" : "none";
  });
}

// تسجيل العمليات في سجل العمليات
function logOperation(message) {
  const logBox = document.getElementById("logBox");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = new Date().toLocaleString() + " - " + message;
  if (message.toLowerCase().includes("user")) {
    entry.style.color = "red";
  }
  logBox.prepend(entry);
}

// تحميل المشتركين من الخادم وعرضهم في قسم "المشتركين"
async function loadSubscribers() {
  try {
    let response = await fetch("api/index.php?action=load");
    let data = await response.json();
    const listContainer = document.getElementById("subscribersList");
    listContainer.innerHTML = "";
    
    data.forEach(sub => {
      const card = document.createElement("div");
      card.classList.add("subscriber-card");

      if (sub.status === 'stopped') {
        card.classList.add("stopped");
      }

      const paymentMethod = (sub.isDebt == 1 || sub.isDebt === "1") ? "بالأجل" : "نقدي";

      let remainingDays = sub.remainingDays;
      if ((remainingDays === undefined || remainingDays === null) && sub.endDate) {
        let endDate = new Date(sub.endDate);
        let today = new Date();
        let diffTime = endDate - today;
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      if (remainingDays === undefined || remainingDays === null) {
        remainingDays = "غير متوفر";
      }

      // **إظهار زر "تشغيل" فقط**
      card.innerHTML = `
        <h3>${sub.name} (${sub.user})</h3>
        <p><strong>نوع الاشتراك:</strong> ${sub.type}</p>
        <p><strong>سعر الاشتراك:</strong> ${sub.amount}</p>
        <p><strong>طريقة الدفع:</strong> ${paymentMethod}</p>
        <p><strong>السبب:</strong> ${sub.reason}</p>
        <p><strong>تاريخ البداية:</strong> ${sub.startDate}</p>
        <p><strong>تاريخ النهاية:</strong> ${sub.endDate}</p>
        <p><strong>الأيام المتبقية:</strong> ${remainingDays}</p>
        <div class="card-buttons">
          <button class="btn-activate" onclick="toggleActivation(${sub.id}, '${sub.status}')">
            ${sub.status === 'active' ? 'إيقاف' : 'تفعيل'}
          </button>
          <button class="btn-edit" onclick="editSubscriber(${sub.id})">تعديل</button>
          <button class="btn-stop" onclick="stopSubscriber(${sub.id}, '${sub.user}')">إيقاف</button>
          <button class="btn-enable" onclick="enablePPPActiveSession('${sub.id}', '${sub.user}', this)" 
            style="background-color: green;">
            تشغيل
          </button>
          <button class="btn-delete" onclick="deleteSubscriber(${sub.id}, '${sub.user}')">حذف</button>
        </div>
      `;

      if (!isNaN(remainingDays)) {
        if (Number(remainingDays) <= 0) {
          card.classList.add("expired");
        } else if (Number(remainingDays) === 3) {
          card.classList.add("warning");
        }
      }
      listContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading subscribers:", error);
  }
}



// تعبئة النموذج ببيانات المشترك عند التعديل
async function editSubscriber(id) {
  let response = await fetch("api/index.php?action=edit&id=" + id);
  let sub = await response.json();
  if(sub) {
    document.getElementById("subscriberId").value = sub.id;
    document.getElementById("subName").value = sub.name;
    document.getElementById("subUser").value = sub.user;
    document.getElementById("subPass").value = ""; // لا تعبئة كلمة السر لأسباب أمنية
    document.getElementById("subType").value = sub.type;
    document.getElementById("subPrice").value = sub.amount;
    document.getElementById("subInstallment").checked = (sub.isDebt == 1);
    document.getElementById("subReason").value = sub.reason || "";
    document.getElementById("subStartDate").value = sub.startDate || "";
    document.getElementById("subEndDate").value = sub.endDate || "";
    document.getElementById("formTitle").innerText = "تعديل مشترك";
    document.getElementById("submitBtn").innerText = "تحديث المشترك";
    showSection(1);
  } else {
    alert("خطأ في جلب بيانات المشترك.");
  }
}

// تغيير حالة المشترك (تفعيل/إيقاف) - دالة عامة (قد تُستخدم في واجهة إدارة الاشتراك)
async function toggleActivation(id, currentStatus) {
  let formData = new FormData();
  formData.append("id", id);
  const cmd = (currentStatus === 'active' ? "disable" : "enable");
  formData.append("cmd", cmd);
  try {
    let response = await fetch("api/index.php?action=activate", {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    alert(result.message);
    logOperation("تغيير حالة المشترك (ID: " + id + "): " + result.message);
    loadSubscribers();
  } catch (error) {
    console.error("Error toggling activation:", error);
  }
}

// إيقاف المشترك وإرسال أمر إلى PPP ثم إزالة اليوزر من واجهة MikroTik
async function stopSubscriber(id, username) {
  let formData = new FormData();
  formData.append("id", id);
  formData.append("user", username);
  try {
    let response = await fetch("api/index.php?action=stop", {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    alert(result.message);
    logOperation("إيقاف المشترك " + username + ": " + result.message);
    loadSubscribers();
  } catch (error) {
    console.error("Error stopping subscriber:", error);
  }
}

// حذف المشترك
async function deleteSubscriber(id, username) {
  if (!confirm("هل أنت متأكد من حذف هذا المشترك؟")) return;
  let formData = new FormData();
  formData.append("id", id);
  formData.append("user", username);
  try {
    let response = await fetch("api/index.php?action=delete", {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    alert(result.message);
    logOperation("حذف المشترك " + username + " (ID: " + id + "): " + result.message);
    loadSubscribers();
  } catch (error) {
    console.error("Error deleting subscriber:", error);
  }
}

/***************************************************
 * دالة لجلب سجلات MikroTik وتحديث السجل في الصفحة
 **************************************************/
async function fetchMikroTikLogs() {
  try {
    let response = await fetch("api/log.php");
    let result = await response.json();
    if (result.success) {
      const logBox = document.getElementById("logBox");
      logBox.innerHTML = ""; // تفريغ المحتوى القديم
      
      // عرض سجلات MikroTik
      result.logs.forEach(log => {
        const entry = document.createElement("div");
        entry.className = "log-entry";
        entry.textContent = (log.time || "Unknown Time") + " - " + (log.message || JSON.stringify(log));
        logBox.appendChild(entry);
      });
    } else {
      console.error(result.error);
    }
  } catch (error) {
    console.error("Error fetching MikroTik logs:", error);
  }
}

// جلب سجلات MikroTik كل دقيقة (60000 مللي ثانية)
setInterval(fetchMikroTikLogs, 60000);

// جلب سجلات MikroTik عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", fetchMikroTikLogs);

// عند تحميل الصفحة، جلب قائمة المشتركين
document.addEventListener("DOMContentLoaded", loadSubscribers);
