<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php'; // تأكد من أن ملف config.php يحتوي على إعدادات الاتصال بالـ PDO وجهاز MikroTik (المتغير $client)

use RouterOS\Query;

try {
    // جلب السجلات من MikroTik باستخدام أمر /log/print
    $query = new Query('/log/print');
    $logs = $client->query($query)->read();
    echo json_encode(["success" => true, "logs" => $logs]);
} catch (Exception $e) {
    echo json_encode(["error" => "Error fetching logs: " . $e->getMessage()]);
}
exit;
