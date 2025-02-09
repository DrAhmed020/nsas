<?php
header("Content-Type: application/json; charset=UTF-8");

// تحميل المكتبات المثبتة عبر Composer
require_once __DIR__ . '/../vendor/autoload.php';

// استيراد الكلاسات من مكتبة RouterOS API
use RouterOS\Client;
use RouterOS\Query;

// تضمين ملف الإعداد الموحد الذي يحتوي على إعدادات الاتصال بقاعدة البيانات وMikroTik
require_once __DIR__ . '/config.php';

// التحقق مما إذا كان هناك طلب حذف
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
    // 🔹 إزالة المشترك من قائمة PPP Secret في MikroTik
    $query = new Query('/ppp/secret/print');
    $query->where('name', $username);
    $existingUsers = $client->query($query)->read();

    if (!empty($existingUsers)) {
        $query = new Query('/ppp/secret/remove');
        // نفترض هنا أن معرف اليوزر يُستخدم كمعرف في MikroTik؛ تأكد من ذلك وفق إعدادات جهازك
        $query->add('=.id=' . $username);
        $client->query($query)->read();
    }

    // 🔹 إزالة المشترك من واجهة PPP (active sessions) في MikroTik إن وجد
    $query = new Query('/ppp/active/print');
    $query->where('name', $username);
    $activeSessions = $client->query($query)->read();

    if (!empty($activeSessions)) {
        foreach ($activeSessions as $session) {
            if (isset($session['.id'])) {
                $sessionId = $session['.id'];
                $queryRemove = new Query('/ppp/active/remove');
                $queryRemove->add('=.id=' . $sessionId);
                $client->query($queryRemove)->read();
            }
        }
    }
} catch (Exception $e) {
    echo json_encode(["error" => "Failed to remove from MikroTik: " . $e->getMessage()]);
    exit;
}

// 🔹 حذف المشترك من قاعدة البيانات MySQL
$stmt = $pdo->prepare("DELETE FROM subscribers WHERE id = :id");
$stmt->execute([':id' => $id]);

echo json_encode(["success" => true, "message" => "Subscriber deleted successfully from DB, secret and PPP interface."]);
exit;
