/***************************************************
 * تغيير عرض الأقسام الرئيسية بناءً على التبويبات
 **************************************************/
export function showSection(index) {
  const sections = document.querySelectorAll(".section");
  sections.forEach((sec, i) => {
    sec.classList.toggle("active", i === index);
  });
  
  document.getElementById("tabListBtn").classList.toggle("active", index === 0);
  document.getElementById("tabAddBtn").classList.toggle("active", index === 1);
  document.getElementById("tabLogBtn").classList.toggle("active", index === 2);

  const manageTabBtn = document.getElementById("tabManageBtn");
  if (manageTabBtn) {
    manageTabBtn.classList.toggle("active", index === 3);
  }

  if (index === 3) {
    showManageSubsection(0);
  }
}

/***************************************************
 * دالة التحكم في التبويبات الفرعية لقسم إدارة المشتركين
 **************************************************/
export function showManageSubsection(subIndex) {
  const subsections = document.querySelectorAll(".manage-subsection");
  subsections.forEach((sub, i) => {
    sub.classList.toggle("active", i === subIndex);
  });

  document.getElementById("tabConnectedBtn").classList.toggle("active", subIndex === 0);
  document.getElementById("tabAllBtn").classList.toggle("active", subIndex === 1);

  if (subIndex === 0) {
    loadConnectedUsers();
  } else {
    loadAllUsers();
  }
}