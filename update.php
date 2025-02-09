<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php'; // ملف الإعداد الموحد الذي يحتوي على الاتصال (PDO)

// استقبال البيانات المُرسلة عبر POST
$id        = $_POST['id'] ?? null;
$name      = $_POST['name'] ?? '';
$user      = $_POST['user'] ?? '';
$pass      = $_POST['pass'] ?? '';
$type      = $_POST['type'] ?? '';
$amount    = $_POST['amount'] ?? '';
$isDebt    = $_POST['isDebt'] ?? '0'; // نفترض قيمة 1 إذا كان الاشتراك بالأجل أو 0 إذا كان نقدي
$status    = $_POST['status'] ?? '';
$reason    = $_POST['reason'] ?? '';
$startDate = $_POST['startDate'] ?? '';
$endDate   = $_POST['endDate'] ?? '';

if (!$id) {
    echo json_encode(["error" => "No ID provided"]);
    exit;
}

// تحديث بيانات المشترك في جدول subscribers
$sql = "UPDATE subscribers 
        SET name = :name, 
            user = :user, 
            pass = :pass, 
            type = :type, 
            amount = :amount, 
            isDebt = :isDebt, 
            status = :status, 
            reason = :reason, 
            startDate = :startDate, 
            endDate = :endDate 
        WHERE id = :id";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':name'      => $name,
    ':user'      => $user,
    ':pass'      => $pass,
    ':type'      => $type,
    ':amount'    => $amount,
    ':isDebt'    => $isDebt,
    ':status'    => $status,
    ':reason'    => $reason,
    ':startDate' => $startDate,
    ':endDate'   => $endDate,
    ':id'        => $id
]);

echo json_encode(["success" => true, "message" => "Subscriber updated successfully."]);
exit;
