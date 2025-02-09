<?php
//header("Content-Type: application/json; charset=UTF-8");

// استدعاء ملف config.php أو ما يماثله للاتصال بالميكروتيك
require_once __DIR__ . '/config.php';
use RouterOS\Query;

// تنفيذ أمر /interface/print لجلب جميع الواجهات
$query = new Query('/interface/print');
$interfaces = $client->query($query)->read();

// عرض النتيجة بصيغة JSON
echo json_encode([
    "success" => true,
    "data" => $interfaces
]);
exit;
