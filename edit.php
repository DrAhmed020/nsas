<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php'; // أو الملف المناسب للاتصال

// الحصول على الـ ID من GET وليس POST
$id = $_GET['id'] ?? null;
if (!$id) {
    echo json_encode(["error" => "No ID provided"]);
    exit;
}

// جلب بيانات المشترك من قاعدة البيانات
$stmt = $pdo->prepare("SELECT * FROM subscribers WHERE id = :id");
$stmt->execute([':id' => $id]);
$subscriber = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$subscriber) {
    echo json_encode(["error" => "Subscriber not found"]);
    exit;
}

echo json_encode($subscriber);
exit;
