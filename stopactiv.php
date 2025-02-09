<?php
header("Content-Type: application/json; charset=UTF-8");

// تحميل المكتبات المثبتة عبر Composer
require_once __DIR__ . '/../vendor/autoload.php';

// استيراد الكلاسات من مكتبة RouterOS API
use RouterOS\Client;
use RouterOS\Query;

// تضمين ملف الإعداد الموحد الذي يحتوي على إعدادات الاتصال بقاعدة البيانات وMikroTik
require_once __DIR__ . '/config.php';

// استقبال البيانات المرسلة عبر POST
$id  = $_POST['id']  ?? null;
$cmd = $_POST['cmd'] ?? null;

if (!$id) {
    echo json_encode(["error" => "No ID provided"]);
    exit;
}

if (!$cmd) {
    echo json_encode(["error" => "No command provided"]);
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

// تنفيذ العملية بناءً على قيمة المعامل cmd
if ($cmd === 'disable') {
    // --- تعطيل المشترك ---
    
    try {
        // 🔹 تعطيل المشترك في MikroTik عبر PPP Secret
        $query = new Query('/ppp/secret/disable');
        // نفترض أن معرف اليوزر هو نفسه المعرف في MikroTik
        $query->add('=.id=' . $username);
        $client->query($query)->read();
    } catch (Exception $e) {
        echo json_encode(["error" => "Error disabling subscriber in MikroTik: " . $e->getMessage()]);
        exit;
    }
    
    try {
        // 🔹 إزالة الجلسة النشطة من واجهة PPP (active sessions) في MikroTik لقطع الاتصال عن المشترك
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
        echo json_encode(["error" => "Error removing active session from MikroTik: " . $e->getMessage()]);
        exit;
    }
    
    try {
        // 🔹 تحديث حالة الاشتراك في قاعدة البيانات MySQL إلى معطل
        $sql = "UPDATE subscribers SET status='stopped', reason='تم الإيقاف بسبب الديون' WHERE id=:id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
    } catch (Exception $e) {
        echo json_encode(["error" => "Error updating subscriber in database: " . $e->getMessage()]);
        exit;
    }
    
    echo json_encode(["success" => true, "message" => "Subscription disabled and active session removed."]);
    exit;
    
} elseif ($cmd === 'enable') {
    // --- تشغيل المشترك ---
    
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
    
} else {
    echo json_encode(["error" => "Invalid command provided"]);
    exit;
}
