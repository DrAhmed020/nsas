/***************************************************
 * مثال: تفعيل PPP Account (إذا كان معطّل)
 **************************************************/
function toggleActivationPPP(userName) {
  alert(`سيتم تنفيذ تفعيل ${userName}...`);
  logOperation(`تفعيل المستخدم ${userName}`);
}

/***************************************************
 * مثال: تعديل المشترك بالاعتماد على userName
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

export { toggleActivationPPP, editSubscriberByUser, deleteSubscriberByUser };