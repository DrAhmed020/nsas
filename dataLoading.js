/***************************************************
 * دالة لجلب المشتركين المتصلين حاليًا من MikroTik
 **************************************************/
async function loadConnectedUsers() {
  const container = document.getElementById("connectedList");
  container.innerHTML = "جاري تحميل المتصلين...";

  try {
    let response = await fetch("api/index.php?action=connected");
    let result = await response.json();

    container.innerHTML = "";

    if (result.success) {
      let activeUsers = result.data;
      if (!activeUsers || !Array.isArray(activeUsers) || activeUsers.length === 0) {
        container.innerHTML = "<p>لا يوجد متصلين حاليًا.</p>";
        return;
      }
      activeUsers.forEach(user => {
        const card = document.createElement("div");
        card.classList.add("subscriber-card");
        
        const userName  = user.name  || "unknown";
        const ipAddress = user.address || "N/A";
        const callerId  = user["caller-id"] || "N/A";
        const profile   = user.profile || "N/A";

        card.innerHTML = `
  <h3>${userName}</h3>
  <p><strong>IP:</strong> ${ipAddress}</p>
  <p><strong>MAC:</strong> ${callerId}</p>
  <p><strong>Profile:</strong> ${profile}</p>
  <div class="card-buttons">
    <button class="btn-activate" onclick="toggleActivationPPP('${userName}')">تفعيل</button>
    <button class="btn-edit" onclick="editSubscriberByUser('${userName}')">تعديل</button>
    <button class="btn-stop" 
      onclick="stopPPPActiveSession('${user['.id']}', '${userName}', this)" 
      style="background-color: red;">
      تعطيل
    </button>
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
 **************************************************/
function loadAllUsers() {
  loadSubscribers();
  setTimeout(() => {
    const mainList = document.getElementById("subscribersList");
    const allList = document.getElementById("allList");
    allList.innerHTML = mainList.innerHTML;
  }, 1000);
}

export { loadConnectedUsers, loadAllUsers };