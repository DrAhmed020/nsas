<?php
header("Content-Type: application/json; charset=UTF-8");

// تحميل مكتبات Composer للمكتبة الخاصة بـ MikroTik
require_once __DIR__ . '/../vendor/autoload.php';
use RouterOS\Client;
use RouterOS\Query;

// استدعاء ملف الاتصال الموحد (الذي يحتوي على إعدادات قاعدة البيانات والاتصال بـ MikroTik)
require_once __DIR__ . '/config.php'; 

// التحقق من توافر معرف المشترك المُرسل عبر POST
$id = $_POST['id'] ?? null;
if (!$id) {
    echo json_encode(["error" => "No ID provided"]);
    exit;
}

// جلب بيانات المشترك من قاعدة البيانات باستخدام PDO
$stmt = $pdo->prepare("SELECT user FROM subscribers WHERE id = :id");
$stmt->execute([':id' => $id]);
$subscriber = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$subscriber) {
    echo json_encode(["error" => "Subscriber not found"]);
    exit;
}

// تفعيل المشترك في MikroTik
try {
    // إعداد استعلام تفعيل المشترك باستخدام اسم اليوزر المخزن في قاعدة البيانات
    $query = new Query('/ppp/secret/enable');
    $query->add('=.id=' . $subscriber['user']);
    $client->query($query)->read();
} catch (Exception $e) {
    echo json_encode(["error" => "MikroTik activation failed: " . $e->getMessage()]);
    exit;
}

// تمديد الاشتراك لمدة 30 يومًا من تاريخ اليوم
$newEndDate = date('Y-m-d', strtotime("+30 days"));
$sql = "UPDATE subscribers SET status = 'active', reason = '', endDate = :newEnd WHERE id = :id";
$stmt = $pdo->prepare($sql);
$stmt->execute([':newEnd' => $newEndDate, ':id' => $id]);

echo json_encode(["success" => true, "message" => "Subscription activated +30 days."]);
exit;
