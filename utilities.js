/***************************************************
 * الدوال القديمة (filterSubscribers, loadSubscribers، إلخ)
 **************************************************/

function filterSubscribers() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".subscriber-card");
  cards.forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(filter) ? "block" : "none";
  });
}

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

async function editSubscriber(id) {
  let response = await fetch("api/index.php?action=edit&id=" + id);
  let sub = await response.json();
  if(sub) {
    document.getElementById("subscriberId").value = sub.id;
    document.getElementById("subName").value = sub.name;
    document.getElementById("subUser").value = sub.user;
    document.getElementById("subPass").value = "";
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

async function fetchMikroTikLogs() {
  try {
    let response = await fetch("api/log.php");
    let result = await response.json();
    if (result.success) {
      const logBox = document.getElementById("logBox");
      logBox.innerHTML = "";
      
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

setInterval(fetchMikroTikLogs, 60000);

document.addEventListener("DOMContentLoaded", fetchMikroTikLogs);
document.addEventListener("DOMContentLoaded", loadSubscribers);

export { filterSubscribers, logOperation, loadSubscribers, editSubscriber, toggleActivation, stopSubscriber, deleteSubscriber, fetchMikroTikLogs };