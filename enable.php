<?php
header("Content-Type: application/json; charset=UTF-8");

// تحميل المكتبات المثبتة عبر Composer
require_once __DIR__ . '/../vendor/autoload.php';

// استيراد الكلاسات من مكتبة RouterOS API
use RouterOS\Client;
use RouterOS\Query;

// تضمين ملف الإعداد الموحد الذي يحتوي على إعدادات الاتصال بقاعدة البيانات وMikroTik
require_once __DIR__ . '/config.php';

// استقبال معرف المشترك المُرسل عبر POST
$id = $_POST['id'] ?? null;
if (!$id) {
    echo json_encode(["error" => "No ID provided"]);
    exit;
}

// 🔹 جلب بيانات المستخدم من قاعدة البيانات
$stmt = $pdo->prepare("SELECT user FROM subscribers WHERE id = :id");
$stmt->execute([':id' => $id]);
$subscriber = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$subscriber) {
    echo json_encode(["error" => "Subscriber not found"]);
    exit;
}

$username = $subscriber['user'];

try {
    // 🔹 تفعيل المشترك في MikroTik عبر PPP Secret
    $query = new Query('/ppp/secret/enable');
    // نفترض أن معرف اليوزر هو نفسه المعرف في MikroTik
    $query->add('=.id=' . $username);
    $client->query($query)->read();
} catch (Exception $e) {
    echo json_encode(["error" => "Error enabling subscriber in MikroTik: " . $e->getMessage()]);
    exit;
}

try {
    // 🔹 تحديث حالة الاشتراك في قاعدة البيانات MySQL إلى مفعل
    $sql = "UPDATE subscribers SET status='active', reason='' WHERE id=:id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
} catch (Exception $e) {
    echo json_encode(["error" => "Error updating subscriber in database: " . $e->getMessage()]);
    exit;
}

echo json_encode(["success" => true, "message" => "Subscription enabled."]);
exit;
