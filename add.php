<?php
header("Content-Type: application/json; charset=UTF-8");

// تحميل مكتبات Composer
require_once __DIR__ . '/../vendor/autoload.php';
use RouterOS\Client;
use RouterOS\Query;

// تضمين ملف الإعداد الموحد الذي يحتوي على إعدادات الاتصال بقاعدة البيانات وجهاز MikroTik
require_once __DIR__ . '/config.php';

// استقبال البيانات من الطلب
$name    = $_POST['name']   ?? '';
$user    = $_POST['user']   ?? '';
$pass    = $_POST['pass']   ?? '';
$type    = $_POST['type']   ?? '';
$amount  = $_POST['amount'] ?? '';
$isDebt  = $_POST['isDebt'] ?? 0;
$status  = "inactive";
$reason  = "";
$startDate = date('Y-m-d');
$endDate   = date('Y-m-d', strtotime("+30 days"));

// التحقق مما إذا كان المستخدم موجودًا بالفعل في قاعدة البيانات
$stmt = $pdo->prepare("SELECT COUNT(*) FROM subscribers WHERE user = :user");
$stmt->execute([':user' => $user]);
if ($stmt->fetchColumn() > 0) {
    echo json_encode(["error" => "Username '$user' already exists in the database!"]);
    exit;
}

// التحقق مما إذا كان المستخدم موجودًا في MikroTik
$query = new Query('/ppp/secret/print');
$query->where('name', $user);
$existingUsers = $client->query($query)->read();
if (!empty($existingUsers)) {
    echo json_encode(["error" => "User '$user' already exists in MikroTik!"]);
    exit;
}

// إدراج المشترك في MySQL
$sql = "INSERT INTO subscribers (name, user, pass, type, amount, isDebt, status, reason, startDate, endDate)
        VALUES (:name, :user, :pass, :type, :amount, :isDebt, :status, :reason, :startDate, :endDate)";
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
    ':endDate'   => $endDate
]);

// تحديد البروفايل بناءً على نوع الاشتراك
$profile = match ($type) {
    "لايت"    => "10M",
    "ايكونمي" => "default",
    "بلص"     => "20M",
    "ستندر"  => "25M",
    default   => "default"
};

// إضافة المشترك إلى MikroTik
$query = new Query('/ppp/secret/add');
$query->add('=name=' . $user);
$query->add('=password=' . $pass);
$query->add('=service=pppoe');
$query->add('=profile=' . $profile);
$client->query($query)->read();

echo json_encode(["success" => true, "message" => "User '$user' added successfully!"]);
exit;
