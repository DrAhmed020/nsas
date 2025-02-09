<?php
header("Content-Type: application/json; charset=UTF-8");

// عرض جميع الأخطاء لمساعدتنا في التصحيح
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ✅ الاتصال بقاعدة البيانات MySQL
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "sas_db";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["error" => "DB Connection Failed: " . $e->getMessage()]);
    exit;
}

// ✅ الاتصال بـ MikroTik RouterOS
require_once '../vendor/autoload.php'; // تحميل المكتبة عبر Composer

use RouterOS\Client;
use RouterOS\Query;

$routeros_host = "30.30.30.1";
$routeros_user = "admin";
$routeros_pass = "*123123";

try {
    $client = new Client([
        'host' => $routeros_host,
        'user' => $routeros_user,
        'pass' => $routeros_pass,
        'port' => 8728
    ]);
} catch (Exception $e) {
    echo json_encode(["error" => "MikroTik Connection Failed: " . $e->getMessage()]);
    exit;
}
?>
