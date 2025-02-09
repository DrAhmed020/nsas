<?php
header("Content-Type: application/json; charset=UTF-8");

// تضمين ملف الإعداد الموحد الذي يحتوي على إعدادات الاتصال بقاعدة البيانات وMikroTik
require_once __DIR__ . '/config.php';

// استقبال بيانات الإدخال من الطلب (يفترض إرسالها عبر POST)
$username = $_POST['username'] ?? null;
$password = $_POST['password'] ?? null;
$type     = $_POST['type'] ?? null;

if (!$username || !$password || !$type) {
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

// تحديد البروفايل بناءً على نوع الاشتراك
switch ($type) {
    case "لايت":
        $profile = "10M";
        break;
    case "ايكونمي":
        $profile = "default"; // أو الاسم الافتراضي المناسب
        break;
    case "بلص":
        $profile = "20M";
        break;
    case "ستند":
        $profile = "25M";
        break;
    default:
        $profile = "default";
        break;
}

try {
    // التحقق من وجود اليوزر في PPP secret في MikroTik
    $query = new RouterOS\Query('/ppp/secret/print');
    $query->where('name', $username);
    $existingUsers = $client->query($query)->read();

    if (!empty($existingUsers)) {
        echo json_encode(["error" => "User already exists in MikroTik"]);
        exit;
    }
} catch (Exception $e) {
    echo json_encode(["error" => "Error checking user in MikroTik: " . $e->getMessage()]);
    exit;
}

try {
    // إضافة اليوزر إلى MikroTik
    $query = new RouterOS\Query('/ppp/secret/add');
    $query->equal('name', $username);
    $query->equal('password', $password);
    $query->equal('service', 'pppoe'); // الخدمة ثابتة
    $query->equal('profile', $profile); // البروفايل بحسب نوع الاشتراك
    $client->query($query)->read();

    echo json_encode(["success" => true, "message" => "User added to MikroTik successfully."]);
    exit;
} catch (Exception $e) {
    echo json_encode(["error" => "Error adding user to MikroTik: " . $e->getMessage()]);
    exit;
}
