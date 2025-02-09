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
    // عرض الافتراضي سيكون المتصلين
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
        
        // على سبيل المثال، user.name = اسم اليوزر، user.address = IP، user["caller-id"] = MAC
        // يمكنك تعديل أو إضافة مفاتيح حسب ما ترجعه استجابة MikroTik
        const userName  = user.name  || "unknown";
        const ipAddress = user.address || "N/A";
        const callerId  = user["caller-id"] || "N/A";
        const profile   = user.profile || "N/A";

        // أنشئ محتوى البطاقة مع الأزرار (يمكنك تعديلها حسب الحاجة)
        card.innerHTML = `
          <h3>${userName}</h3>
          <p><strong>IP:</strong> ${ipAddress}</p>
          <p><strong>MAC:</strong> ${callerId}</p>
          <p><strong>Profile:</strong> ${profile}</p>
          <div class="card-buttons">
            <!-- أمثلة: تفعيل/إيقاف/تعديل/حذف -->
            <button class="btn-activate" onclick="toggleActivationPPP('${userName}')">تفعيل</button>
            <button class="btn-stop" onclick="stopPPPActiveSession('${user['.id']}', '${userName}')">إيقاف</button>
            <button class="btn-edit" onclick="editSubscriberByUser('${userName}')">تعديل</button>
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
  // يمكنك هنا إعادة استخدام دالة loadSubscribers(), مع تغيير الحاوية target
  // أو إنشاء دالة جديدة تشبه loadSubscribers مع استخدام عنصر #allList بدلًا من #subscribersList

  // في هذا المثال البسيط، سنُعيد استخدام نفس دالة loadSubscribers ثم ننقل البطاقات
  // إلى قسم #allList. لكن نظريًا ستحتاج إلى تعديل loadSubscribers نفسها
  // لتدعم وسيطًا (containerId) أو غير ذلك.
  
  // أسرع حل مؤقت:
  loadSubscribers(); // يجلب المشتركين في قسم #listSection (subscribersList)

  // بعد جلب المشتركين، يمكنك نسخ ما في subscribersList إلى allList
  setTimeout(() => {
    const mainList = document.getElementById("subscribersList");
    const allList = document.getElementById("allList");
    allList.innerHTML = mainList.innerHTML;
  }, 1000);
}

/***************************************************
 * مثال: إيقاف جلسة PPP Active عبر .id
 * (تحتاج لملف API stopActive.php أو index.php?action=stopActive)
 **************************************************/
async function stopPPPActiveSession(sessionId, userName) {
  if (!confirm(`هل أنت متأكد من إيقاف جلسة المستخدم ${userName} ؟`)) return;

  let formData = new FormData();
  formData.append("sessionId", sessionId);
  formData.append("username", userName);

  try {
    let response = await fetch("api/index.php?action=stopActive", {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    if (result.success) {
      alert(result.message);
      logOperation("إيقاف جلسة " + userName + ": " + result.message);
      loadConnectedUsers(); // تحديث قائمة المتصلين
    } else {
      alert(result.error || "حدث خطأ في إيقاف الجلسة.");
    }
  } catch (error) {
    console.error("Error stopping PPP session:", error);
    alert("تعذّر إيقاف الجلسة.");
  }
}

/***************************************************
 * مثال: تفعيل PPP Account (اذا كان معطّل)
 **************************************************/
function toggleActivationPPP(userName) {
  // هنا يمكنك استدعاء API خاصة بتفعيل المستخدم في /ppp/secret
  // أو تحديث حالة الاشتراك في قاعدة البيانات
  // (مثال توضيحي)
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
  // يمكنك استخدام fetch("api/index.php?action=editByUser&user=" + userName)
  // ثم تعبئة نموذج التعديل
}

/***************************************************
 * مثال: حذف المشترك بالاعتماد على userName
 **************************************************/
function deleteSubscriberByUser(userName) {
  if (!confirm(`هل أنت متأكد من حذف المستخدم ${userName} ؟`)) return;
  alert(`سيتم حذف المستخدم ${userName} من DB و MikroTik إن وجد.`);
  logOperation(`حذف المستخدم ${userName}`);
  // تستطيع استدعاء API مثل fetch("api/index.php?action=deleteByUser&user=" + userName)
  // وتنفيذ عملية الحذف
}

/***************************************************
 * الدوال القديمة (filterSubscribers, loadSubscribers, إلخ)
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
  // لو ظهرت كلمة user نجعل لون السطر أحمر
  if (message.toLowerCase().includes("user")) {
    entry.style.color = "red";
  }
  logBox.prepend(entry);
}

// تحميل المشتركين من الخادم وعرضهم في قسم "المشتركين" الأساسي
async function loadSubscribers() {
  try {
    let response = await fetch("api/index.php?action=load");
    let data = await response.json();
    const listContainer = document.getElementById("subscribersList");
    listContainer.innerHTML = "";
    data.forEach(sub => {
      const card = document.createElement("div");
      card.classList.add("subscriber-card");
      
      if(sub.status === 'stopped'){
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
          <button class="btn-delete" onclick="deleteSubscriber(${sub.id}, '${sub.user}')">حذف</button>
        </div>
      `;
      if(!isNaN(remainingDays)) {
        if(Number(remainingDays) <= 0) {
          card.classList.add("expired");
        } else if(Number(remainingDays) === 3) {
          card.classList.add("warning");
        }
      }
      listContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading subscribers:", error);
  }
}

// إعادة تعيين نموذج الإضافة/التعديل
function resetSubscriberForm() {
  document.getElementById("subscriberForm").reset();
  document.getElementById("subscriberId").value = "";
  document.getElementById("formTitle").innerText = "إضافة مشترك";
  document.getElementById("submitBtn").innerText = "إضافة المشترك";
}

// التحقق من عدم تكرار اسم اليوزر قبل الإضافة
async function checkUserExistence(username) {
  let response = await fetch("api/index.php?action=checkUser&user=" + encodeURIComponent(username));
  let result = await response.json();
  return result.exists;
}

// إرسال بيانات النموذج لإضافة أو تحديث مشترك
async function submitSubscriberForm(event) {
  event.preventDefault();
  const id = document.getElementById("subscriberId").value;
  const userVal = document.getElementById("subUser").value;
  if (!id && await checkUserExistence(userVal)) {
    alert("اسم اليوزر مكرر، يرجى اختيار اسم آخر.");
    return;
  }
  
  const formData = new FormData(document.getElementById("subscriberForm"));
  formData.set("isDebt", document.getElementById("subInstallment").checked ? "1" : "0");
  
  let actionUrl = id ? "api/index.php?action=update" : "api/index.php?action=add";
  if(id) formData.append("id", id);

  try {
    let response = await fetch(actionUrl, {
      method: "POST",
      body: formData
    });
    let result = await response.json();
    alert(result.message);
    logOperation((id ? "تحديث" : "إضافة") + " المشترك " + userVal + ": " + result.message);
    if (result.success) {
      loadSubscribers();
      resetSubscriberForm();
      showSection(0);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
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

// تغيير حالة المشترك (تفعيل/إيقاف)
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
